import type { MemorySummary } from "../moments";
import { liquidHeaderTokens, memoryFeedTokens } from "../../shared/constants/tokens.ts";

export type MemoryCalendarDay = { day: string; number: number; today: boolean; future: boolean; unloaded: boolean; memories: MemorySummary[]; imageCount: number };
export type MemoryCalendarMonth = { key: string; year: number; month: number; cells: (MemoryCalendarDay | null)[] };
const dayMillis = 86_400_000;

export function getMemoryCalendarScrollLayout(topInset: number) {
  // Inverted index 0 is the visual bottom. Older pages append above the user,
  // so entering does not require rendering every month to jump to scrollToEnd.
  return { inverted: true as const, initialOffset: 0, paddingTop: memoryFeedTokens.navigationClearance, paddingBottom: getMemoryFeedHeaderClearance(topInset) };
}

export function getMemoryFeedHeaderClearance(topInset: number) {
  return topInset + liquidHeaderTokens.topGap + memoryFeedTokens.headerHeight + liquidHeaderTokens.contentGap;
}

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function localCalendarDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function buildMemoryCalendar(records: readonly MemorySummary[], today: string, partial = false): MemoryCalendarMonth[] {
  const current = parseDay(today);
  if (!current) return [];
  const grouped = new Map<string, MemorySummary[]>();
  let earliest = today;
  for (const memory of records) {
    if (!parseDay(memory.memory_date) || memory.memory_date > today) continue;
    if (memory.memory_date < earliest) earliest = memory.memory_date;
    grouped.set(memory.memory_date, [...grouped.get(memory.memory_date) ?? [], memory]);
  }
  const months: MemoryCalendarMonth[] = [];
  const cursor = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1, 12));
  while (cursor.toISOString().slice(0, 7) >= earliest.slice(0, 7)) {
    const key = cursor.toISOString().slice(0, 7);
    const cells: (MemoryCalendarDay | null)[] = Array.from({ length: (cursor.getUTCDay() + 6) % 7 }, () => null);
    const days = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
    for (let number = 1; number <= days; number++) {
      const day = `${key}-${String(number).padStart(2, "0")}`;
      const memories = grouped.get(day) ?? [];
      cells.push({ day, number, today: day === today, future: day > today, unloaded: partial && day <= earliest, memories, imageCount: memories.reduce((sum, item) => sum + item.image_count, 0) });
    }
    while (cells.length % 7) cells.push(null);
    months.push({ key, year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1, cells });
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return months;
}

export function getMemoryCalendarStats(records: readonly MemorySummary[], today: string, partial: boolean) {
  const valid = records.filter((item) => parseDay(item.memory_date));
  const photoDays = new Set(valid.filter((item) => item.image_count > 0 && item.memory_date <= today).map((item) => item.memory_date));
  const current = parseDay(today);
  let streak = 0;
  let boundary = today;
  if (current) {
    let cursor = current.getTime();
    if (!photoDays.has(today)) cursor -= dayMillis;
    while (photoDays.has(new Date(cursor).toISOString().slice(0, 10))) { streak++; cursor -= dayMillis; }
    boundary = new Date(cursor).toISOString().slice(0, 10);
  }
  const oldest = valid.reduce((day, item) => item.memory_date < day ? item.memory_date : day, today);
  return {
    photoCount: records.reduce((sum, item) => sum + item.image_count, 0),
    streak,
    partial,
    streakIsLowerBound: partial && streak > 0 && boundary < oldest,
  };
}
