import { localDateKey } from "../../shared/datetime/localDate.ts";
import { localCoupleService, type LocalCoupleService } from "../couple/localCoupleService.ts";
import { localOnboardingService } from "../onboarding/localOnboardingService.ts";
import { resolveEmotionSelection } from "./emotionCatalog.ts";
import { emotionCheckInSchema, type EmotionCheckInInput } from "./schemas.ts";
import {
  localCheckInReasons,
  type CheckInReason,
  type EmotionCheckIn,
  isEmotionCheckIn,
  type LocalCheckIn,
  type PartnerVisibleCheckIn,
} from "./types.ts";

export type CheckInSubmissionResult =
  | { kind: "saved_local" | "pending"; checkIn: EmotionCheckIn }
  | { kind: "error"; error: "validation" | "storage"; retryable: boolean };

export type LocalCheckInService = {
  listForAccount: (accountId: string) => Promise<LocalCheckIn[]>;
  submit: (accountId: string, input: EmotionCheckInInput) => Promise<CheckInSubmissionResult>;
  getLatestPartnerCheckIn: (accountId: string) => Promise<PartnerVisibleCheckIn | null>;
  getByIdForAccount: (accountId: string, checkInId: string) => Promise<PartnerVisibleCheckIn | null>;
  getReasons: () => Promise<CheckInReason[]>;
  clearAccount: (accountId: string) => Promise<void>;
  clearCouple: (coupleId: string) => Promise<void>;
};

export type LocalCheckInServiceOptions = {
  coupleService?: LocalCoupleService;
  createId?: () => string;
  now?: () => Date;
  timezoneForAccount?: (accountId: string) => string | Promise<string>;
  reasonCatalog?: readonly CheckInReason[];
  initialCheckIns?: readonly LocalCheckIn[];
  persist?: (checkIn: EmotionCheckIn) => Promise<"saved_local" | "pending">;
};

function cloneCheckIn(checkIn: LocalCheckIn): LocalCheckIn {
  if (isEmotionCheckIn(checkIn)) return { ...checkIn };
  return { ...checkIn, reasonIds: [...checkIn.reasonIds] };
}

function toPartnerVisible(checkIn: LocalCheckIn): PartnerVisibleCheckIn | null {
  if (isEmotionCheckIn(checkIn)) {
    return {
      kind: "emotion",
      id: checkIn.id,
      authorId: checkIn.authorId,
      emotionId: checkIn.emotionId,
      customEmotionLabel: checkIn.customEmotionLabel,
      emotionTone: checkIn.emotionTone,
      note: checkIn.note,
      mascotStickerId: checkIn.mascotStickerId,
      createdAt: checkIn.createdAt,
      localDate: checkIn.localDate,
    };
  }
  if (checkIn.shareScope === "private_only") return null;
  if (checkIn.shareScope === "mood_only") {
    return {
      kind: "legacy",
      id: checkIn.id,
      authorId: checkIn.authorId,
      mood: checkIn.mood,
      shareScope: "mood_only",
      createdAt: checkIn.createdAt,
      localDate: checkIn.localDate,
    };
  }
  return {
    kind: "legacy",
    id: checkIn.id,
    authorId: checkIn.authorId,
    mood: checkIn.mood,
    shareScope: "full",
    reasonIds: [...checkIn.reasonIds],
    note: checkIn.note,
    createdAt: checkIn.createdAt,
    localDate: checkIn.localDate,
  };
}

export function createLocalCheckInService({
  coupleService = localCoupleService,
  createId,
  now = () => new Date(),
  timezoneForAccount = async (accountId) => (await localOnboardingService.getAccountSnapshot(accountId)).profile.timezone,
  reasonCatalog = localCheckInReasons,
  initialCheckIns = [],
  persist = async () => "saved_local",
}: LocalCheckInServiceOptions = {}): LocalCheckInService {
  const checkIns = new Map<string, LocalCheckIn>(initialCheckIns.map((checkIn) => [checkIn.id, cloneCheckIn(checkIn)]));
  let sequence = 0;
  const makeId = createId ?? (() => `local-checkin-${now().getTime()}-${++sequence}`);

  const visibleForPartner = async (accountId: string, checkIn: LocalCheckIn): Promise<PartnerVisibleCheckIn | null> => {
    const membership = await coupleService.getMembership(accountId);
    if (membership.status !== "paired" || !membership.partner || checkIn.authorId !== membership.partner.id) return null;
    if (!checkIn.coupleId || checkIn.coupleId !== membership.coupleId) return null;
    return toPartnerVisible(checkIn);
  };

  return {
    async listForAccount(accountId) {
      return [...checkIns.values()]
        .filter((checkIn) => checkIn.authorId === accountId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map(cloneCheckIn);
    },

    async submit(accountId, input) {
      const parsed = emotionCheckInSchema.safeParse(input);
      if (!parsed.success) return { kind: "error", error: "validation", retryable: false };
      const emotion = resolveEmotionSelection(parsed.data.emotionId, parsed.data.customEmotionLabel);
      if (!emotion) return { kind: "error", error: "validation", retryable: false };

      const createdAt = now().toISOString();
      const membership = await coupleService.getMembership(accountId);
      const draft: EmotionCheckIn = {
        kind: "emotion",
        id: makeId(),
        authorId: accountId,
        coupleId: membership.status === "paired" ? membership.coupleId : null,
        emotionId: emotion.emotionId,
        customEmotionLabel: emotion.customEmotionLabel,
        emotionTone: emotion.emotionTone,
        note: parsed.data.note,
        mascotStickerId: parsed.data.mascotStickerId,
        createdAt,
        localDate: localDateKey(new Date(createdAt), await timezoneForAccount(accountId)),
        status: "saved_local",
      };

      try {
        const kind = await persist({ ...draft });
        const saved: EmotionCheckIn = { ...draft, status: kind };
        checkIns.set(saved.id, saved);
        return { kind, checkIn: { ...saved } };
      } catch {
        return { kind: "error", error: "storage", retryable: true };
      }
    },

    async getLatestPartnerCheckIn(accountId) {
      const membership = await coupleService.getMembership(accountId);
      const partner = membership.partner;
      if (membership.status !== "paired" || !partner) return null;

      const partnerToday = localDateKey(now(), partner.timezone);
      const candidates = [...checkIns.values()]
        .filter((checkIn) =>
          checkIn.authorId === partner.id &&
          checkIn.coupleId === membership.coupleId &&
          localDateKey(new Date(checkIn.createdAt), partner.timezone) === partnerToday,
        )
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
      for (const candidate of candidates) {
        const visible = toPartnerVisible(candidate);
        if (visible) return visible;
      }
      return null;
    },

    async getByIdForAccount(accountId, checkInId) {
      const checkIn = checkIns.get(checkInId);
      return checkIn ? visibleForPartner(accountId, checkIn) : null;
    },

    async getReasons() {
      return reasonCatalog.map((reason) => ({ ...reason }));
    },

    async clearAccount(accountId) {
      for (const [id, checkIn] of checkIns) {
        if (checkIn.authorId === accountId) checkIns.delete(id);
      }
    },

    async clearCouple(coupleId) {
      for (const [id, checkIn] of checkIns) {
        if (checkIn.coupleId === coupleId) checkIns.delete(id);
      }
    },
  };
}

export const localCheckInService = createLocalCheckInService();
