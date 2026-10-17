import type { Nudge } from "./types";

export function selectActionableNudges(nudges: Nudge[]): Nudge[] {
  return nudges
    .filter((nudge) => nudge.status === "new" || nudge.status === "snoozed")
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}
