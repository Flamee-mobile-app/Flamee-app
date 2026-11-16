import assert from "node:assert/strict";
import test from "node:test";
import { createConversationApi, ConversationError } from "./conversationApi.ts";
const comment = { id: "c", memory_id: "m/1", parent_id: null, body: "Hi", deleted: false, version: 0, created_at: "2026-11-15T00:00:00Z", updated_at: "2026-11-15T00:00:00Z", author: { id: "author", full_name: "Name", username: null }, parent_author: null, heart_count: 0, hearted: false };

test("post likes use authenticated desired-state requests and reject wrong-post acknowledgements", async () => {
  const methods: string[] = [];
  const api = createConversationApi({ baseUrl: "https://api.test", fetcher: async (url, options) => {
    assert.equal(url, "https://api.test/memories/m%2F1/heart");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer token");
    methods.push(options!.method!);
    return Response.json({ success: true, data: { memory_id: "m/1", heart_count: 1, hearted: options?.method === "PUT" } });
  } });
  await api.postHeart("token", "m/1");
  assert.equal((await api.postHeart("token", "m/1", true)).hearted, true);
  assert.equal((await api.postHeart("token", "m/1", false)).hearted, false);
  assert.deepEqual(methods, ["GET", "PUT", "DELETE"]);
  const wrong = createConversationApi({ baseUrl: "https://api.test", fetcher: async () => Response.json({ success: true, data: { memory_id: "other", heart_count: 2, hearted: true } }) });
  await assert.rejects(wrong.postHeart("token", "m/1", true), (error: ConversationError) => error.code === "response");
});

test("send authenticates, encodes IDs and preserves the stable send key and exact reply target", async () => {
  const api = createConversationApi({ baseUrl: "https://api.test/", fetcher: async (url, options) => {
    assert.equal(url, "https://api.test/memories/m%2F1/comments");
    assert.equal(options?.method, "POST");
    const headers = new Headers(options?.headers);
    assert.equal(headers.get("Authorization"), "Bearer token"); assert.equal(headers.get("Idempotency-Key"), "retry-key");
    assert.deepEqual(JSON.parse(options?.body as string), { body: "Hi", parent_id: null });
    return Response.json({ success: true, data: comment });
  } });
  assert.deepEqual(await api.send("token", "m/1", "Hi", null, "retry-key"), comment);
});

test("heart is desired-state PUT/DELETE and validates acknowledgement instead of manufacturing success", async () => {
  const methods: string[] = [];
  const api = createConversationApi({ baseUrl: "https://api.test", fetcher: async (_url, options) => {
    methods.push(options!.method!); return Response.json({ success: true, data: { ...comment, hearted: options?.method === "PUT", heart_count: options?.method === "PUT" ? 1 : 0 } });
  } });
  assert.equal((await api.heart("token", "m/1", "c", true)).hearted, true);
  assert.equal((await api.heart("token", "m/1", "c", false)).heart_count, 0);
  assert.deepEqual(methods, ["PUT", "DELETE"]);
});

test("a missing migration, denied membership and malformed success never become an empty inbox", async () => {
  for (const response of [Response.json({}, { status: 503 }), Response.json({}, { status: 403 }), Response.json({ success: true, data: {} })]) {
    const api = createConversationApi({ baseUrl: "https://api.test", fetcher: async () => response });
    await assert.rejects(api.inbox("token"), ConversationError);
  }
});

test("cancelled requests remain cancellation and never overwrite the new route with a timeout", async () => {
  const controller = new AbortController(); controller.abort();
  const api = createConversationApi({ baseUrl: "https://api.test", fetcher: async () => { throw Error("must not fetch"); } });
  await assert.rejects(api.list("token", "m", 0, controller.signal), (error: Error) => error.name === "AbortError");
});

test("401 remains refreshable unauthorized while 403 is denied couple membership", async () => {
  for (const [status, code] of [[401, "unauthorized"], [403, "forbidden"]] as const) {
    const api = createConversationApi({ baseUrl: "https://api.test", fetcher: async () => Response.json({}, { status }) });
    await assert.rejects(api.inbox("expired"), (error: ConversationError) => error.code === code);
  }
});

test("a successful response for another post or comment cannot clear the current draft", async () => {
  const api = createConversationApi({ baseUrl: "https://api.test", fetcher: async () => Response.json({ success: true, data: { ...comment, memory_id: "other" } }) });
  await assert.rejects(api.send("token", "m/1", "Hi", null, "retry"), (error: ConversationError) => error.code === "response");
});

test("a 200 without the acknowledged delete/edit/heart state is rejected", async () => {
  const api = createConversationApi({ baseUrl: "https://api.test", fetcher: async () => Response.json({ success: true, data: comment }) });
  await assert.rejects(api.remove("token", "m/1", "c", 0), (error: ConversationError) => error.code === "response");
  await assert.rejects(api.heart("token", "m/1", "c", true), (error: ConversationError) => error.code === "response");
  await assert.rejects(api.edit("token", "m/1", "c", "Changed", 0), (error: ConversationError) => error.code === "response");
});
