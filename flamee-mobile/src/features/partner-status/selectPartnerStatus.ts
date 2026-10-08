import type { PartnerVisibleCheckIn } from "../checkins/types.ts";
import type { PartnerStatusView, PartnerStatusViewer } from "./types.ts";
import { localDateKey } from "../../shared/datetime/localDate.ts";

function timezoneOffsetHours(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return (representedAsUtc - date.getTime()) / 3_600_000;
}

export function selectPartnerStatus(
  checkIns: readonly PartnerVisibleCheckIn[],
  viewer: PartnerStatusViewer,
): PartnerStatusView {
  const partnerLocalTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: viewer.partner.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(viewer.now);
  const timezoneDifferenceHours =
    timezoneOffsetHours(viewer.now, viewer.partner.timezone) -
    timezoneOffsetHours(viewer.now, viewer.timezone);
  const base = { partner: viewer.partner, partnerLocalTime, timezoneDifferenceHours };
  const partnerToday = localDateKey(viewer.now, viewer.partner.timezone);

  const latest = checkIns
    .filter(
      (checkIn) =>
        checkIn.authorId === viewer.partner.id &&
        localDateKey(new Date(checkIn.createdAt), viewer.partner.timezone) === partnerToday,
    )
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];

  if (!latest) return { ...base, kind: "no_update" };

  const minutesAgo = Math.max(
    0,
    Math.floor((viewer.now.getTime() - Date.parse(latest.createdAt)) / 60_000),
  );
  if (latest.shareScope === "mood_only") {
    return {
      ...base,
      kind: "mood_only",
      mood: latest.mood,
      updatedAt: latest.createdAt,
      minutesAgo,
    };
  }
  return {
    ...base,
    kind: "full",
    mood: latest.mood,
    reasonIds: [...latest.reasonIds],
    note: latest.note,
    updatedAt: latest.createdAt,
    minutesAgo,
  };
}
