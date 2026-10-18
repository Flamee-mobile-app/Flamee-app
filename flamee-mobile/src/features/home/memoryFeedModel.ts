import type { MemorySummary } from "../moments";
import type { Locale } from "../../shared/localization/messages.ts";

export type MemoryFeedView = "timeline" | "memories";

function calendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function selectMemoryFeed(records: readonly MemorySummary[], view: MemoryFeedView): MemorySummary[] {
  return records.filter((record) => view === "timeline" || (record.image_count > 0 && record.thumbnail_url !== null))
    .sort((left, right) => (calendarDate(right.memory_date)?.getTime() ?? 0) - (calendarDate(left.memory_date)?.getTime() ?? 0) || right.id.localeCompare(left.id));
}

export function formatMemoryDate(value: string, locale: Locale): string | null {
  const date = calendarDate(value);
  return date ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date) : null;
}
