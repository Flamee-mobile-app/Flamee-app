import { isEmotionCheckIn, isPartnerVisibleEmotionCheckIn, type EmotionCheckIn, type PartnerVisibleCheckIn } from "../checkins/types.ts";
import type { Nudge } from "../nudges/types.ts";

export type HomeHeroPresentation =
  | { kind: "empty" }
  | { kind: "saved"; checkInId: string; note: string }
  | { kind: "nudge"; nudgeId: string };

export type PartnerNotePreview = { checkInId: string; note: string };

export function selectHomeHero(
  latestCheckIn: EmotionCheckIn | null,
  nudges: readonly Nudge[],
): HomeHeroPresentation {
  const activeNudge = nudges.find((nudge) => nudge.status === "new" || nudge.status === "snoozed");
  if (activeNudge) return { kind: "nudge", nudgeId: activeNudge.id };
  if (latestCheckIn && isEmotionCheckIn(latestCheckIn)) {
    return { kind: "saved", checkInId: latestCheckIn.id, note: latestCheckIn.note };
  }
  return { kind: "empty" };
}

export function createPartnerNotePreview(checkIn: PartnerVisibleCheckIn | null): PartnerNotePreview | null {
  if (!checkIn) return null;
  if (isPartnerVisibleEmotionCheckIn(checkIn)) return { checkInId: checkIn.id, note: checkIn.note };
  if (checkIn.shareScope === "full" && checkIn.note.trim()) return { checkInId: checkIn.id, note: checkIn.note };
  return null;
}

export function isCurrentHomeLoad(
  requestRevision: number,
  requestAccountId: string,
  currentRevision: number,
  currentAccountId: string | null,
): boolean {
  return requestRevision === currentRevision && requestAccountId === currentAccountId;
}
