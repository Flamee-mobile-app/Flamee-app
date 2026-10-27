import assert from "node:assert/strict";
import test from "node:test";
import { createMoodApi, MoodApiError, type ServerMood } from "./moodApi.ts";
import { latestMoodByDay, moodHistoryRecords } from "./moodHistoryModel.ts";
import { QueryClient } from "@tanstack/react-query";
import { moodHistoryOptions, pruneMoodHistory } from "./moodQueries.ts";

const mood: ServerMood = { id: "a", mood: "love", created_at: "2026-10-27T23:30:00Z", intensity: 5, mood_score: 4, note: "mine", reasons: ["work"], is_private: true, share_level: "private" };

test("history uses bearer identity and preserves private owner data and original mood", async () => {
  const api = createMoodApi({ baseUrl: "https://example.test/api/v1/", fetcher: async (url, init) => {
    assert.equal(String(url), "https://example.test/api/v1/moods?limit=50&offset=50");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer session");
    return Response.json({ success: true, data: [mood] });
  } });
  assert.deepEqual(await api.history("session", { limit: 50, offset: 50 }), [mood]);
});

test("failed reads and malformed timestamps never become confirmed empty history", async () => {
  for (const response of [Response.json({}, { status: 401 }), Response.json({}, { status: 500 }), Response.json({ success: true, data: [{ ...mood, created_at: "bad" }] })]) {
    const api = createMoodApi({ baseUrl: "https://example.test", fetcher: async () => response });
    await assert.rejects(api.history("token", { limit: 50, offset: 0 }), MoodApiError);
  }
});

test("partner DTO rejects private moods and strips hidden mood-only content", async () => {
  const api = (latest_mood: ServerMood) => createMoodApi({ baseUrl: "https://example.test", fetcher: async () => Response.json({ success: true, data: { partner_id: "b", latest_mood } }) });
  await assert.rejects(api(mood).partner("token"), MoodApiError);
  const projected = await api({ ...mood, is_private: false, share_level: "mood_only" }).partner("token");
  assert.equal(projected?.latest_mood?.note, null);
  assert.equal(projected?.latest_mood?.reasons, null);
});

test("calendar selects the latest server timestamp after dedupe and local day conversion", () => {
  const rows = [{ ...mood, id: "new" }, { ...mood, id: "old", mood: "sad", created_at: "2026-10-27T18:00:00Z" }, { ...mood, id: "new" }];
  const records = moodHistoryRecords(rows, (date) => new Date(date.getTime() + 7 * 3600_000).toISOString().slice(0, 10));
  assert.equal(records.length, 2);
  assert.equal(latestMoodByDay(records).get("2026-10-28")?.id, "new");
  assert.equal(records[1].emotionId, "love");
});

test("account switch aborts history and removes private cached rows", async () => {
  const client = new QueryClient();
  const scope = { accountId: "a", sessionId: 1 };
  const options = moodHistoryOptions(scope, async () => [mood]);
  await client.fetchInfiniteQuery(options);
  let signal!: AbortSignal;
  const pending = client.fetchInfiniteQuery({ ...options, staleTime: 0, queryFn: ({ signal: next }) => { signal = next; return new Promise<ServerMood[]>(() => {}); } }).catch(() => undefined);
  pruneMoodHistory(client, { accountId: "b", sessionId: 2 });
  await pending;
  assert.equal(signal.aborted, true);
  assert.equal(client.getQueryData(options.queryKey), undefined);
  client.clear();
});
