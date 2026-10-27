import assert from "node:assert/strict";
import test from "node:test";
import { buildMemoryCalendar, getMemoryCalendarStats, getMemoryCalendarScrollLayout, getMemoryFeedHeaderClearance, localCalendarDay } from "./memoryCalendarModel.ts";

const photo = (id: string, day: string, count = 1) => ({ id, title: id, category: "moment", memory_date: day, location: null, is_pinned: false, thumbnail_url: `https://example.test/${id}.jpg`, image_count: count });

test("calendar starts Monday, preserves leap days, and runs from the current month into the past", () => {
  const months = buildMemoryCalendar([photo("leap", "2024-02-29")], "2024-03-02");
  assert.deepEqual(months.map((month) => month.key), ["2024-03", "2024-02"]);
  const february = months[1];
  assert.equal(february.cells[0], null);
  assert.equal(february.cells[3]?.day, "2024-02-01");
  assert.equal(february.cells.filter(Boolean).length, 29);
  assert.equal(february.cells.length % 7, 0);
  assert.equal(february.cells.find((cell) => cell?.day === "2024-02-29")?.memories[0].id, "leap");
});

test("multiple memories share one calendar day; today and future cells are distinct", () => {
  const current = buildMemoryCalendar([photo("one", "2026-10-18"), photo("two", "2026-10-18", 2), photo("future", "2026-10-19"), photo("invalid", "2026-02-31")], "2026-10-18")[0];
  const today = current.cells.find((cell) => cell?.today);
  assert.equal(today?.memories.length, 2);
  assert.equal(today?.imageCount, 3);
  assert.equal(current.cells.find((cell) => cell?.day === "2026-10-19")?.future, true);
  assert.equal(current.cells.find((cell) => cell?.day === "2026-10-17")?.future, false);
});

test("confirmed empty data still renders the current month and an add action for today", () => {
  const months = buildMemoryCalendar([], "2026-10-18");
  assert.equal(months.length, 1);
  assert.equal(months[0].cells.find((cell) => cell?.today)?.day, "2026-10-18");
});

test("current month is first even when API records arrive oldest-first or cross a year boundary", () => {
  const months = buildMemoryCalendar([photo("aug", "2026-08-04"), photo("sep", "2026-09-17"), photo("oct", "2026-10-18")], "2026-10-18");
  assert.deepEqual(months.map((month) => month.key), ["2026-10", "2026-09", "2026-08"]);
  assert.deepEqual(buildMemoryCalendar([photo("old", "2025-11-20")], "2026-01-12").map((month) => month.key), ["2026-01", "2025-12", "2025-11"]);
});

test("calendar enters at the newest bottom anchor and shows older months above it", () => {
  const months = buildMemoryCalendar([photo("aug", "2026-08-04"), photo("sep", "2026-09-17"), photo("oct", "2026-10-18")], "2026-10-18");
  const layout = getMemoryCalendarScrollLayout(50);
  assert.equal(layout.inverted, true);
  assert.equal(layout.initialOffset, 0);
  assert.equal(months[0].key, "2026-10");
  assert.deepEqual([...months].reverse().map((month) => month.key), ["2026-08", "2026-09", "2026-10"]);
  assert.equal(layout.paddingTop, 116, "inverted top padding visually clears the bottom nav");
  assert.equal(layout.paddingBottom, 136, "inverted bottom padding visually clears the floating header and its 20px gap");
});

test("floating header keeps a full 20px gap before content in both calendar and feed layouts", () => {
  const topInset = 50;
  const headerBottom = topInset + 6 + 60;
  assert.equal(getMemoryFeedHeaderClearance(topInset) - headerBottom, 20);
  assert.equal(getMemoryCalendarScrollLayout(topInset).paddingBottom, getMemoryFeedHeaderClearance(topInset));
});

test("photo streak uses unique photo dates, accepts yesterday, ignores text-only and future days", () => {
  const records = [photo("a", "2026-10-17", 2), photo("b", "2026-10-17"), photo("c", "2026-10-16"), photo("future", "2026-10-19"), { ...photo("text", "2026-10-15"), image_count: 0, thumbnail_url: null }];
  assert.deepEqual(getMemoryCalendarStats(records, "2026-10-18", false), { photoCount: 5, streak: 2, partial: false, streakIsLowerBound: false });
  assert.equal(getMemoryCalendarStats(records, "2026-10-20", false).streak, 1);
  assert.equal(getMemoryCalendarStats(records, "2026-10-22", false).streak, 0);
});

test("partial history never claims a complete photo total or an exact streak at its oldest boundary", () => {
  const records = [photo("a", "2026-10-18"), photo("b", "2026-10-17")];
  assert.equal(getMemoryCalendarStats(records, "2026-10-18", true).streakIsLowerBound, true);
  assert.equal(getMemoryCalendarStats(records, "2026-10-20", true).streakIsLowerBound, false);
  assert.equal(localCalendarDay(new Date(2026, 9, 18, 0, 1)), "2026-10-18");
  const partialMonth = buildMemoryCalendar(records, "2026-10-18", true)[0];
  assert.equal(partialMonth.cells.find((cell) => cell?.day === "2026-10-16")?.unloaded, true);
  assert.equal(partialMonth.cells.find((cell) => cell?.day === "2026-10-18")?.unloaded, false);
});
