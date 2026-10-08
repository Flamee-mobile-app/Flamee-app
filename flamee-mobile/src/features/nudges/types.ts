import type { LocalCheckIn } from "../checkins/index.ts";

export const negativeFeedbackReasons = [
  "wrong_tone",
  "too_generic",
  "bad_timing",
  "not_our_style",
  "other",
] as const;

export type NegativeFeedbackReason = (typeof negativeFeedbackReasons)[number];

export type NudgeStatus = "new" | "snoozed" | "acted" | "skipped" | "expired";
export type NudgeActionType = "text" | "voice" | "photo" | "call" | "other";
export type NudgeTone = "gentle" | "playful" | "supportive" | "celebratory" | "crisis_safe";

export type Nudge = {
  id: string;
  coupleId: string;
  recipientId: string;
  sourceCheckInId: string;
  observation: string;
  actionType: NudgeActionType;
  draft: string;
  reason: string;
  tone: NudgeTone;
  source: "template" | "safety";
  status: NudgeStatus;
  createdAt: string;
  expiresAt: string;
  snoozeCount: number;
  linkedMomentId: string | null;
  feedback: { value: "up" } | { value: "down"; reason: NegativeFeedbackReason } | null;
};

export type NudgeContent = Pick<Nudge, "observation" | "actionType" | "draft" | "reason" | "tone">;

export type CreateNudgeInput = {
  sourceCheckIn: LocalCheckIn;
  recipientId: string;
  recipientTimezone: string;
  coupleId: string;
  safetyConcern?: boolean;
};

export type CreateNudgeResult =
  | { kind: "created"; nudge: Nudge }
  | { kind: "suppressed"; reason: "private_only" | "stale_couple" | "recent_unresolved" | "daily_limit" }
  | { kind: "support_content_unavailable" }
  | { kind: "template_unavailable" };

export type NudgeMutationResult =
  | { kind: "updated"; nudge: Nudge }
  | { kind: "not_found" | "expired" | "invalid_transition" | "validation" };
