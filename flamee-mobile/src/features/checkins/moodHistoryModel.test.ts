import assert from "node:assert/strict";
import test from "node:test";
import { latestMoodByDay, moodHistoryRecords, recentProfileMood } from "./moodHistoryModel.ts";
import type { ServerMood } from "./moodApi.ts";

test("calendar uses the latest confirmed check-in for each day without inventing missing moods", () => {
  const result = latestMoodByDay([
    { id: "old", day: "2026-10-19", emotionId: "sad" },
    { id: "new", day: "2026-10-19", emotionId: "happy" },
    { id: "other", day: "2026-10-20", emotionId: "calm" },
  ]);
  assert.equal(result.get("2026-10-19")?.id, "new");
  assert.equal(result.get("2026-10-18"), undefined);
});

const saved: ServerMood = { id: "confirmed", mood: "discouraged", created_at: "2026-11-20T23:30:00Z", local_date: "2026-11-21", mood_score: 2, intensity: 4, sleep_hours: 5, note: "A quiet evening", reasons: ["work"], attachments: [{ kind: "gif", id: "discouraged" }], is_private: false, share_level: "all" };

test("calendar preserves the server local day and complete acknowledged check-in", () => {
  const [record] = moodHistoryRecords([saved], () => "2026-11-20");
  assert.equal(record.day, "2026-11-21");
  assert.equal(record.emotionId, "discouraged");
  assert.deepEqual(record.source, saved);
  const [legacy] = moodHistoryRecords([{ ...saved, local_date: null }], () => "2026-11-20");
  assert.equal(legacy.day, "2026-11-20");
});

test("profile uses the latest confirmed check-in and expires it at 24 hours without mutating history", () => {
  const now = Date.parse(saved.created_at) + 60_000;
  const rows = [{ ...saved, id: "older", created_at: "2026-11-20T22:30:00Z" }, saved];
  assert.equal(recentProfileMood(rows, now)?.id, "confirmed");
  assert.equal(recentProfileMood([saved], Date.parse(saved.created_at) + 24 * 60 * 60 * 1000), null);
  assert.equal(recentProfileMood([saved], Date.parse(saved.created_at) - 1), null);
  assert.equal(recentProfileMood([], now), null);
  assert.equal(rows.length, 2);
});
