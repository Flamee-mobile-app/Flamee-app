import { localDateKey } from "../../shared/datetime/localDate.ts";
import { localCoupleService, type LocalCoupleService } from "../couple/index.ts";
import { localOnboardingService } from "../onboarding/index.ts";
import { createCheckInSchema, type CheckInInput } from "./schemas.ts";
import { localCheckInReasons, type CheckInReason, type LocalCheckIn, type PartnerVisibleCheckIn } from "./types.ts";

export type CheckInSubmissionResult =
  | { kind: "saved_local" | "pending"; checkIn: LocalCheckIn }
  | { kind: "error"; error: "validation" | "storage"; retryable: boolean };

export type LocalCheckInService = {
  listForAccount: (accountId: string) => Promise<LocalCheckIn[]>;
  submit: (accountId: string, input: CheckInInput) => Promise<CheckInSubmissionResult>;
  getLatestPartnerCheckIn: (accountId: string) => Promise<PartnerVisibleCheckIn | null>;
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
  persist?: (checkIn: LocalCheckIn) => Promise<"saved_local" | "pending">;
};

export function createLocalCheckInService({
  coupleService = localCoupleService,
  createId,
  now = () => new Date(),
  timezoneForAccount = async (accountId) => (await localOnboardingService.getAccountSnapshot(accountId)).profile.timezone,
  reasonCatalog = localCheckInReasons,
  persist = async () => "saved_local",
}: LocalCheckInServiceOptions = {}): LocalCheckInService {
  const checkIns = new Map<string, LocalCheckIn>();
  let sequence = 0;
  const makeId = createId ?? (() => `local-checkin-${now().getTime()}-${++sequence}`);

  const clone = (checkIn: LocalCheckIn): LocalCheckIn => ({ ...checkIn, reasonIds: [...checkIn.reasonIds] });

  return {
    async listForAccount(accountId) {
      return [...checkIns.values()]
        .filter((checkIn) => checkIn.authorId === accountId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map(clone);
    },

    async submit(accountId, input) {
      const parsed = createCheckInSchema(reasonCatalog.map((reason) => reason.id)).safeParse(input);
      if (!parsed.success) return { kind: "error", error: "validation", retryable: false };

      const createdAt = now().toISOString();
      const membership = await coupleService.getMembership(accountId);
      const draft: LocalCheckIn = {
        id: makeId(),
        clientId: makeId(),
        authorId: accountId,
        coupleId: membership.status === "paired" ? membership.coupleId : null,
        mood: parsed.data.mood as LocalCheckIn["mood"],
        reasonIds: [...parsed.data.reasonIds],
        note: parsed.data.note,
        shareScope: parsed.data.shareScope,
        createdAt,
        localDate: localDateKey(new Date(createdAt), await timezoneForAccount(accountId)),
        storageStatus: "saved_local",
      };

      try {
        const kind = await persist(clone(draft));
        const saved = { ...draft, storageStatus: kind };
        checkIns.set(saved.id, saved);
        return { kind, checkIn: clone(saved) };
      } catch {
        return { kind: "error", error: "storage", retryable: true };
      }
    },

    async getLatestPartnerCheckIn(accountId) {
      const membership = await coupleService.getMembership(accountId);
      const partner = membership.partner;
      if (membership.status !== "paired" || !partner) return null;

      const partnerToday = localDateKey(now(), partner.timezone);
      const latest = [...checkIns.values()]
        .filter((checkIn) =>
          checkIn.authorId === partner.id &&
          checkIn.coupleId === membership.coupleId &&
          checkIn.shareScope !== "private_only" &&
          localDateKey(new Date(checkIn.createdAt), partner.timezone) === partnerToday,
        )
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];
      if (!latest) return null;

      if (latest.shareScope === "mood_only") {
        return {
          id: latest.id,
          authorId: latest.authorId,
          mood: latest.mood,
          shareScope: latest.shareScope,
          createdAt: latest.createdAt,
          localDate: latest.localDate,
        };
      }
      if (latest.shareScope !== "full") return null;
      return {
        id: latest.id,
        authorId: latest.authorId,
        mood: latest.mood,
        shareScope: latest.shareScope,
        reasonIds: [...latest.reasonIds],
        note: latest.note,
        createdAt: latest.createdAt,
        localDate: latest.localDate,
      };
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
