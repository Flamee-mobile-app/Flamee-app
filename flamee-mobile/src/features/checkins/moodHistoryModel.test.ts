import assert from "node:assert/strict";
import test from "node:test";
import { latestMoodByDay } from "./moodHistoryModel.ts";

test("calendar uses the latest confirmed check-in for each day without inventing missing moods", () => {
  const result = latestMoodByDay([
    { id: "old", day: "2026-10-19", emotionId: "sad" },
    { id: "new", day: "2026-10-19", emotionId: "happy" },
    { id: "other", day: "2026-10-20", emotionId: "calm" },
  ]);
  assert.equal(result.get("2026-10-19")?.id, "new");
  assert.equal(result.get("2026-10-18"), undefined);
});
