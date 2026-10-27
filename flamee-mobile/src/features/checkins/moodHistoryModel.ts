export type MoodHistoryRecord = { id: string; day: string; emotionId: string };

export function latestMoodByDay(records: readonly MoodHistoryRecord[]) {
  const result = new Map<string, MoodHistoryRecord>();
  for (const record of records) result.set(record.day, record);
  return result;
}
