import type { ServerMood } from "./moodApi.ts";
import { moodCalendarDay } from "./moodCalendarModel.ts";

export type MoodHistoryRecord = { id: string; day: string; emotionId: string; source?: ServerMood };

/** Calendar consumes oldest first; preserve every server mood ID without lossy mapping. */
export function moodHistoryRecords(rows: readonly ServerMood[], dayFor = moodCalendarDay): MoodHistoryRecord[] {
  const unique = new Map(rows.map((row) => [row.id, row]));
  return [...unique.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id))
    .map((row) => ({ id: row.id, day: row.local_date && /^\d{4}-\d{2}-\d{2}$/.test(row.local_date) ? row.local_date : dayFor(new Date(row.created_at)), emotionId: row.mood, source: row }));
}

export function recentProfileMood(rows: readonly ServerMood[], now = Date.now()) {
  return rows.filter((row) => { const age = now - Date.parse(row.created_at); return age >= 0 && age < 24 * 60 * 60 * 1000; })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] ?? null;
}

export function latestMoodByDay(records: readonly MoodHistoryRecord[]) {
  const result = new Map<string, MoodHistoryRecord>();
  for (const record of records) result.set(record.day, record);
  return result;
}
