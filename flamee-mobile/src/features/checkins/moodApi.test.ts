import assert from "node:assert/strict";
import test from "node:test";
import { createMoodApi, MoodApiError, type ServerMood } from "./moodApi.ts";
import { latestMoodByDay, moodHistoryRecords } from "./moodHistoryModel.ts";
import { QueryClient } from "@tanstack/react-query";
import { moodHistoryOptions, partnerMoodOptions, pruneMoodHistory } from "./moodQueries.ts";

const mood: ServerMood = { id: "a", mood: "love", created_at: "2026-10-27T23:30:00Z", intensity: 5, mood_score: 4, note: "mine", reasons: ["work"], is_private: true, share_level: "private" };

test("creating mood sends bearer, stable idempotency key and full-sharing payload", async () => {
  const payload = { draft_version: 2 as const, mood: "happy", intensity: 4, mood_score: 3, note: "Hi", reasons: ["work"], custom_emotion_label: null, mascot_sticker_id: "mascot-neutral", sleep_hours: null, attachments: [], timezone: "Asia/Ho_Chi_Minh", share_level: "all" as const, is_private: false as const };
  const api = createMoodApi({ baseUrl: "https://example.test", fetcher: async (url, init) => {
    assert.equal(url, "https://example.test/moods"); assert.equal(init?.method, "POST");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    assert.equal(new Headers(init?.headers).get("Idempotency-Key"), "stable-key");
    assert.deepEqual(JSON.parse(init?.body as string), payload);
    return Response.json({ success: true, data: { ...mood, ...payload, local_date: "2026-11-16" } });
  } });
  assert.equal((await api.create("token", payload, "stable-key")).id, "a");
});

test("daily reminder uses account bearer, timezone and encoded reminder ID without inventing unread status", async () => {
  const calls: string[] = [];
  const reminder = { id: "rem/1", local_date: "2026-11-16", timezone: "Asia/Ho_Chi_Minh", created_at: "2026-11-16T12:00:00Z", read_at: null };
  const api = createMoodApi({ baseUrl: "https://example.test", fetcher: async (url, init) => {
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    calls.push(`${init?.method} ${url}`);
    const path = String(url);
    if (path.endsWith("/ensure")) { assert.deepEqual(JSON.parse(init?.body as string), { timezone: "Asia/Ho_Chi_Minh" }); return Response.json({ success: true, data: { show_prompt: true, reminder } }); }
    if (path.includes("/rem%2F1/read")) return Response.json({ success: true, data: { ...reminder, read_at: "2026-11-16T12:01:00Z" } });
    return Response.json({ success: true, data: { items: [reminder], total: 1, unread_count: 1 } });
  } });
  assert.equal((await api.ensureReminder("token", "Asia/Ho_Chi_Minh")).show_prompt, true);
  assert.equal((await api.reminders("token", 20)).unread_count, 1);
  assert.ok((await api.readReminder("token", "rem/1")).read_at);
  assert.deepEqual(calls, ["POST https://example.test/moods/reminders/ensure", "GET https://example.test/moods/reminders?limit=20&offset=20", "PUT https://example.test/moods/reminders/rem%2F1/read"]);
  const bad = createMoodApi({ baseUrl: "https://example.test", fetcher: async () => Response.json({ success: true, data: { show_prompt: true, reminder: null } }) });
  await assert.rejects(bad.ensureReminder("token", "UTC"), MoodApiError);
});

test("partner mood reuses fresh data and requests it again once stale", async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let reads = 0;
  const options = partnerMoodOptions({ accountId: "a", sessionId: 1, coupleId: "couple" }, async () => { reads++; return null; });
  await cache.fetchQuery(options);
  await cache.fetchQuery(options);
  assert.equal(reads, 1);
  const now = Date.now;
  try {
    Date.now = () => now() + 31_000;
    await cache.fetchQuery(options);
    assert.equal(reads, 2);
  } finally { Date.now = now; cache.clear(); }
});

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

test("daily reminders use authenticated server acknowledgements and never fabricate a prompt", async () => {
  const reminder = { id: "r1", local_date: "2026-11-16", timezone: "Asia/Ho_Chi_Minh", created_at: "2026-11-16T01:00:00Z", read_at: null };
  const calls: string[] = [];
  const api = createMoodApi({ baseUrl: "https://example.test", fetcher: async (url, init) => {
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer token");
    calls.push(`${init?.method} ${new URL(String(url)).pathname}`);
    if (String(url).endsWith("/ensure")) return Response.json({ success: true, data: { show_prompt: true, reminder } });
    return Response.json({ success: true, data: { ...reminder, read_at: "2026-11-16T02:00:00Z" } });
  } });
  assert.equal((await api.ensureReminder("token", "Asia/Ho_Chi_Minh")).reminder?.id, "r1");
  assert.ok((await api.readReminder("token", "r1")).read_at);
  assert.deepEqual(calls, ["POST /moods/reminders/ensure", "PUT /moods/reminders/r1/read"]);
  const invalid = createMoodApi({ baseUrl: "https://example.test", fetcher: async () => Response.json({ success: true, data: { show_prompt: true, reminder: null } }) });
  await assert.rejects(invalid.ensureReminder("token", "UTC"), MoodApiError);
});
