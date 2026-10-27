import { moodCalendarDay } from "./moodCalendarModel.ts";
import type { MoodHistoryRecord } from "./moodHistoryModel.ts";

const feelings = ["happy", "calm", "loved", "hopeful", "tired", "uncertain", "sad"] as const;
const extraFeelings = ["overwhelmed", "calm", "happy"] as const;
const parseDay = (day: string) => new Date(`${day}T12:00:00Z`);
const formatDay = (date: Date) => date.toISOString().slice(0, 10);

/** Explicit presentation preview requested by the user; never persisted or submitted. */
export function createMoodPreviewRecords(today: string): MoodHistoryRecord[] {
  const current = parseDay(today);
  if (!Number.isFinite(current.getTime()) || formatDay(current) !== today) return [];
  const monday = new Date(current);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7 - 7);
  const week = feelings.map((emotionId, index) => {
    const date = new Date(monday);
    date.setUTCDate(date.getUTCDate() + index);
    return { id: `preview-mood-week-${index}`, day: formatDay(date), emotionId };
  });
  const extras = [3, 7, 10].map((offset, index) => {
    const date = new Date(monday);
    date.setUTCDate(date.getUTCDate() - offset);
    return { id: `preview-mood-extra-${index}`, day: formatDay(date), emotionId: extraFeelings[index] };
  });
  return [...week, ...extras];
}

export const moodPreviewRecords = createMoodPreviewRecords(moodCalendarDay(new Date()));
