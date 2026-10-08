import { localDateKey } from "../../shared/datetime/localDate.ts";
import { getMessage } from "../../shared/localization/messages.ts";
import type { LocalCheckIn, PartnerVisibleCheckIn } from "../checkins/types.ts";
import { nudgeFeedbackSchema, nudgeSchema } from "./schemas.ts";
import type { CreateNudgeInput, CreateNudgeResult, Nudge, NudgeContent, NudgeMutationResult } from "./types.ts";

type NudgeContentInput = Omit<CreateNudgeInput, "sourceCheckIn"> & {
  sourceCheckIn: PartnerVisibleCheckIn;
  safetyConcern: boolean;
};

export type LocalNudgeService = {
  createForSharedCheckIn: (input: CreateNudgeInput) => Promise<CreateNudgeResult>;
  getForAccount: (accountId: string, nudgeId: string) => Promise<Nudge | null>;
  listForAccount: (accountId: string) => Promise<Nudge[]>;
  act: (nudgeId: string, input?: { momentId?: string; draft?: string }) => Promise<NudgeMutationResult>;
  snooze: (nudgeId: string) => Promise<NudgeMutationResult>;
  skip: (nudgeId: string) => Promise<NudgeMutationResult>;
  rate: (nudgeId: string, value: "up" | "down", reason?: string) => Promise<NudgeMutationResult>;
  clearCouple: (coupleId: string) => Promise<void>;
};

export type LocalNudgeServiceOptions = {
  createId?: () => string;
  now?: () => Date;
  resolveLocalDay?: (date: Date, timezone: string) => string;
  templateProvider?: (input: NudgeContentInput) => NudgeContent | null | Promise<NudgeContent | null>;
  safetyContentProvider?: (input: NudgeContentInput) => NudgeContent | null | Promise<NudgeContent | null>;
};

function toPartnerVisibleCheckIn(checkIn: LocalCheckIn): PartnerVisibleCheckIn | null {
  if (checkIn.shareScope === "private_only") return null;
  if (checkIn.shareScope === "mood_only") {
    return {
      id: checkIn.id,
      authorId: checkIn.authorId,
      mood: checkIn.mood,
      shareScope: "mood_only",
      createdAt: checkIn.createdAt,
      localDate: checkIn.localDate,
    };
  }
  return {
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

function defaultTemplateProvider(): NudgeContent {
  return {
    observation: getMessage("vi", "nudgeTemplateObservation"),
    actionType: "text",
    draft: getMessage("vi", "nudgeTemplateDraft"),
    reason: getMessage("vi", "nudgeTemplateReason"),
    tone: "gentle",
  };
}

export function createLocalNudgeService({
  createId,
  now = () => new Date(),
  resolveLocalDay = localDateKey,
  templateProvider = defaultTemplateProvider,
  safetyContentProvider = () => null,
}: LocalNudgeServiceOptions = {}): LocalNudgeService {
  const nudges = new Map<string, Nudge>();
  let sequence = 0;
  const makeId = createId ?? (() => `local-nudge-${now().getTime()}-${++sequence}`);
  const clone = (nudge: Nudge): Nudge => ({ ...nudge, feedback: nudge.feedback ? { ...nudge.feedback } : null });

  const expire = (nudge: Nudge, currentTime: Date): void => {
    if ((nudge.status === "new" || nudge.status === "snoozed") && Date.parse(nudge.expiresAt) <= currentTime.getTime()) {
      nudge.status = "expired";
    }
  };

  const getMutable = (nudgeId: string): { nudge: Nudge } | { result: NudgeMutationResult } => {
    const nudge = nudges.get(nudgeId);
    if (!nudge) return { result: { kind: "not_found" } };
    expire(nudge, now());
    if (nudge.status === "expired") return { result: { kind: "expired" } };
    return { nudge };
  };

  return {
    async createForSharedCheckIn(input) {
      if (input.sourceCheckIn.shareScope === "private_only") return { kind: "suppressed", reason: "private_only" };
      if (!input.sourceCheckIn.coupleId || input.sourceCheckIn.coupleId !== input.coupleId) {
        return { kind: "suppressed", reason: "stale_couple" };
      }
      const sourceCheckIn = toPartnerVisibleCheckIn(input.sourceCheckIn);
      if (!sourceCheckIn) return { kind: "suppressed", reason: "private_only" };

      const currentTime = now();
      for (const nudge of nudges.values()) expire(nudge, currentTime);
      const hasRecentUnresolved = [...nudges.values()].some((nudge) =>
        nudge.coupleId === input.coupleId &&
        nudge.recipientId === input.recipientId &&
        (nudge.status === "new" || nudge.status === "snoozed") &&
        currentTime.getTime() - Date.parse(nudge.createdAt) < 4 * 60 * 60 * 1000,
      );
      if (hasRecentUnresolved) return { kind: "suppressed", reason: "recent_unresolved" };

      const recipientDay = resolveLocalDay(currentTime, input.recipientTimezone);
      const countForDay = [...nudges.values()].filter((nudge) =>
        nudge.recipientId === input.recipientId &&
        resolveLocalDay(new Date(nudge.createdAt), input.recipientTimezone) === recipientDay,
      ).length;
      if (countForDay >= 3) return { kind: "suppressed", reason: "daily_limit" };

      const contentInput: NudgeContentInput = { ...input, sourceCheckIn, safetyConcern: input.safetyConcern === true };
      let content: NudgeContent | null;
      if (contentInput.safetyConcern) {
        try {
          content = await safetyContentProvider(contentInput);
        } catch {
          content = null;
        }
        if (!content || content.tone !== "crisis_safe") return { kind: "support_content_unavailable" };
      } else {
        try {
          content = await templateProvider(contentInput);
        } catch {
          content = null;
        }
        if (!content) return { kind: "template_unavailable" };
      }

      const createdAt = currentTime.toISOString();
      const candidate: Nudge = {
        id: makeId(),
        coupleId: input.coupleId,
        recipientId: input.recipientId,
        sourceCheckInId: input.sourceCheckIn.id,
        ...content,
        source: contentInput.safetyConcern ? "safety" : "template",
        status: "new",
        createdAt,
        expiresAt: new Date(currentTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        snoozeCount: 0,
        linkedMomentId: null,
        feedback: null,
      };
      const parsed = nudgeSchema.safeParse(candidate);
      if (!parsed.success) return contentInput.safetyConcern ? { kind: "support_content_unavailable" } : { kind: "template_unavailable" };
      nudges.set(parsed.data.id, parsed.data);
      return { kind: "created", nudge: clone(parsed.data) };
    },

    async getForAccount(accountId, nudgeId) {
      const nudge = nudges.get(nudgeId);
      if (!nudge || nudge.recipientId !== accountId) return null;
      expire(nudge, now());
      return clone(nudge);
    },

    async listForAccount(accountId) {
      const currentTime = now();
      return [...nudges.values()]
        .filter((nudge) => nudge.recipientId === accountId)
        .map((nudge) => { expire(nudge, currentTime); return nudge; })
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map(clone);
    },

    async act(nudgeId, input = {}) {
      const current = getMutable(nudgeId);
      if ("result" in current) return current.result;
      const momentId = input.momentId?.trim();
      if (!momentId || (current.nudge.status !== "new" && current.nudge.status !== "snoozed")) return { kind: "invalid_transition" };
      if (input.draft !== undefined && input.draft.length > 280) return { kind: "validation" };
      current.nudge.status = "acted";
      current.nudge.linkedMomentId = momentId;
      if (input.draft !== undefined) current.nudge.draft = input.draft.trim();
      return { kind: "updated", nudge: clone(current.nudge) };
    },

    async snooze(nudgeId) {
      const current = getMutable(nudgeId);
      if ("result" in current) return current.result;
      if (current.nudge.status !== "new" || current.nudge.snoozeCount >= 1) return { kind: "invalid_transition" };
      current.nudge.status = "snoozed";
      current.nudge.snoozeCount += 1;
      return { kind: "updated", nudge: clone(current.nudge) };
    },

    async skip(nudgeId) {
      const current = getMutable(nudgeId);
      if ("result" in current) return current.result;
      if (current.nudge.status !== "new" && current.nudge.status !== "snoozed") return { kind: "invalid_transition" };
      current.nudge.status = "skipped";
      return { kind: "updated", nudge: clone(current.nudge) };
    },

    async rate(nudgeId, value, reason) {
      const current = getMutable(nudgeId);
      if ("result" in current) return current.result;
      if (current.nudge.status !== "acted" && current.nudge.status !== "skipped") return { kind: "invalid_transition" };
      const parsed = nudgeFeedbackSchema.safeParse(value === "up" ? { value } : { value, reason });
      if (!parsed.success) return { kind: "validation" };
      current.nudge.feedback = parsed.data;
      return { kind: "updated", nudge: clone(current.nudge) };
    },

    async clearCouple(coupleId) {
      for (const [id, nudge] of nudges) {
        if (nudge.coupleId === coupleId) nudges.delete(id);
      }
    },
  };
}

export const localNudgeService = createLocalNudgeService();
