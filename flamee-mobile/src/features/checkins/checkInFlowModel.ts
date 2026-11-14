import { emotionCatalog } from "./emotionCatalog.ts";
import { resolveCheckInFeeling } from "./checkInFeelingCatalog.ts";
import { localCheckInReasons } from "./types.ts";

export const checkInSteps = ["feeling", "reasons", "intensity", "note"] as const;
export type CheckInStep = typeof checkInSteps[number];
export const checkInReasonOptions = localCheckInReasons
  .filter(({ id }) => ["work", "study", "tired", "stress", "anxious", "family", "friends"].includes(id))
  .sort((left, right) => left.id === "friends" && right.id === "family" ? -1 : left.id === "family" && right.id === "friends" ? 1 : 0);
export type CheckInAttachmentKind = "gif" | "emoji" | "sticker";
export type CheckInAttachment = { kind: CheckInAttachmentKind; id: string };
export type CheckInDraft = {
  emotionId: string;
  customEmotionLabel: string;
  mascotStickerId: string;
  reasonIds: string[];
  intensity: number | null;
  sleepHours: number | null;
  note: string;
  attachments: CheckInAttachment[];
};

export function createCheckInDraft(): CheckInDraft {
  return { emotionId: "", customEmotionLabel: "", mascotStickerId: "mascot-neutral", reasonIds: [], intensity: null, sleepHours: null, note: "", attachments: [] };
}

export function toggleSelection(values: readonly string[], id: string): string[] {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

export function setCheckInAttachment(attachments: readonly CheckInAttachment[], selected: CheckInAttachment): CheckInAttachment[] {
  const current = attachments.find(({ kind }) => kind === selected.kind);
  if (current?.id === selected.id) return attachments.filter(({ kind }) => kind !== selected.kind);
  return [...attachments.filter(({ kind }) => kind !== selected.kind), selected];
}

const isFivePointScore = (value: number | null) => value !== null && Number.isInteger(value) && value >= 1 && value <= 5;
export function canContinueCheckIn(step: CheckInStep, draft: CheckInDraft): boolean {
  switch (step) {
    case "feeling": return draft.emotionId === "custom" ? draft.customEmotionLabel.trim().length > 0 && draft.customEmotionLabel.trim().length <= 32 : Boolean(resolveCheckInFeeling(draft.emotionId) || emotionCatalog.some((emotion) => emotion.id === draft.emotionId));
    case "reasons": return draft.reasonIds.length > 0;
    case "intensity": return isFivePointScore(draft.intensity)
      && (draft.sleepHours === null || (Number.isInteger(draft.sleepHours) && draft.sleepHours >= 2 && draft.sleepHours <= 8));
    case "note": return draft.note.trim().length > 0 && Array.from(draft.note).length <= 60;
    default: return true;
  }
}

export function hasCheckInAnswers(draft: CheckInDraft): boolean {
  return Boolean(draft.emotionId || draft.customEmotionLabel.trim() || draft.reasonIds.length
    || draft.intensity !== null || draft.sleepHours !== null || draft.note.trim() || draft.attachments.length);
}
