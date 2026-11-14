import assert from "node:assert/strict";
import test from "node:test";
import { selectMemoryFeed, formatMemoryDate } from "./memoryFeedModel.ts";

test("timeline sorts actual memory dates; gallery contains only records with a real image", () => {
  const base = { category: "moment", location: null, is_pinned: false, image_count: 0, thumbnail_url: null };
  const older = { ...base, id: "old", title: "Older", memory_date: "2026-01-01", thumbnail_url: "https://media.example.test/old.jpg", image_count: 1 };
  const newest = { ...base, id: "new", title: "Text only", memory_date: "2026-10-18" };
  const noPhoto = { ...base, id: "missing", title: "No image URL", memory_date: "2026-02-01", image_count: 1 };
  const records = [older, newest, noPhoto];
  assert.deepEqual(selectMemoryFeed(records, "timeline").map((item) => item.id), ["new", "missing", "old"]);
  assert.deepEqual(selectMemoryFeed(records, "memories").map((item) => item.id), ["old"]);
  assert.deepEqual(records.map((item) => item.id), ["old", "new", "missing"]);
});

test("date-only memories keep the calendar date without device timezone shifting it", () => {
  assert.equal(formatMemoryDate("2026-10-18", "en"), "Oct 18, 2026");
  assert.equal(formatMemoryDate("bad-date", "en"), null);
  assert.equal(formatMemoryDate("2026-02-31", "en"), null);
});
