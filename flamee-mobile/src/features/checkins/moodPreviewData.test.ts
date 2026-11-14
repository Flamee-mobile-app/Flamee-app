import assert from "node:assert/strict";
import test from "node:test";
import { createMoodPreviewRecords } from "./moodPreviewData.ts";

test("preview data fills one completed Monday-to-Sunday week with varied moods", () => {
  const records = createMoodPreviewRecords("2026-10-19");
  assert.deepEqual(records.slice(0, 7).map((record) => record.day), [
    "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18",
  ]);
  assert.ok(new Set(records.slice(0, 7).map((record) => record.emotionId)).size >= 5);
  assert.ok(records.every((record) => record.day <= "2026-10-19"));
});

test("preview records are presentation-only IDs and contain no account or couple identity", () => {
  const records = createMoodPreviewRecords("2026-10-19");
  assert.ok(records.every((record) => record.id.startsWith("preview-mood-")));
  assert.ok(records.every((record) => !Object.keys(record).some((key) => ["accountId", "coupleId", "userId"].includes(key))));
});
