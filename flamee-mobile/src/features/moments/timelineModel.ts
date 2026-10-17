import { localDateKey } from "../../shared/datetime/localDate.ts";
import type { Moment } from "./types.ts";

export type TimelineView = "timeline" | "memories";
export type TimelineSection = { date: string; timestamp: string; data: Moment[] };

export function groupTimelineMoments(moments: Moment[], coupleId: string, timezone: string, view: TimelineView): TimelineSection[] {
  const groups = new Map<string, TimelineSection>();
  const visible = moments.filter((moment) =>
    moment.coupleId === coupleId && !moment.parentMomentId && Number.isFinite(Date.parse(moment.createdAt)) &&
    (view === "timeline" || (moment.status === "saved_local" && (moment.kind === "photo" || moment.kind === "voice"))),
  ).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  for (const moment of visible) {
    const date = localDateKey(new Date(moment.createdAt), timezone);
    const group = groups.get(date) ?? { date, timestamp: moment.createdAt, data: [] };
    group.data.push(moment);
    groups.set(date, group);
  }
  return [...groups.values()];
}
