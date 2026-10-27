import type { ServerMood } from "./moodApi.ts";
import { moodCalendarDay } from "./moodCalendarModel.ts";

export type MoodHistoryRecord = { id: string; day: string; emotionId: string };

/** Calendar consumes oldest first; preserve every server mood ID without lossy mapping. */
export function moodHistoryRecords(rows: readonly ServerMood[], dayFor = moodCalendarDay): MoodHistoryRecord[] {
  const unique = new Map(rows.map((row) => [row.id, row]));
  return [...unique.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id))
    .map((row) => ({ id: row.id, day: dayFor(new Date(row.created_at)), emotionId: row.mood }));
}

export function latestMoodByDay(records: readonly MoodHistoryRecord[]) {
  const result = new Map<string, MoodHistoryRecord>();
  for (const record of records) result.set(record.day, record);
  return result;
}
