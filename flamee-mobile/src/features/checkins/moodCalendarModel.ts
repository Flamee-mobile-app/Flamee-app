export type MoodCalendarMode = "week" | "month";
export function moodCalendarDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const dateAt = (day: string) => new Date(`${day}T12:00:00Z`);
const asDay = (date: Date) => date.toISOString().slice(0, 10);

export function moodCalendarCells(anchor: string, mode: MoodCalendarMode): (string | null)[] {
  const date = dateAt(anchor);
  if (!Number.isFinite(date.getTime()) || asDay(date) !== anchor) return [];
  if (mode === "week") {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    return Array.from({ length: 7 }, (_, index) => { const cell = new Date(date); cell.setUTCDate(cell.getUTCDate() + index); return asDay(cell); });
  }
  date.setUTCDate(1);
  const cells: (string | null)[] = Array.from({ length: (date.getUTCDay() + 6) % 7 }, () => null);
  const month = date.getUTCMonth();
  while (date.getUTCMonth() === month) { cells.push(asDay(date)); date.setUTCDate(date.getUTCDate() + 1); }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function moveMoodPeriod(anchor: string, mode: MoodCalendarMode, direction: number): string {
  const date = dateAt(anchor);
  if (mode === "week") date.setUTCDate(date.getUTCDate() + direction * 7);
  else { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + direction); }
  return asDay(date);
}
