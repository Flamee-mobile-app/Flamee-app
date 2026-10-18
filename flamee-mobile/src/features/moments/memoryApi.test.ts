import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryApi, MemoryApiError } from "./memoryApi.ts";

const memory = { id: "memory-1", title: "Một ngày bên nhau", category: "moment", memory_date: "2026-10-18", location: null, is_pinned: false, thumbnail_url: "https://media.example.test/photo.jpg", image_count: 1 };

test("memory feed reads the actual album API with bearer auth and no client couple ID", async () => {
  const api = createMemoryApi({ baseUrl: "https://api.example.test/api/v1/", fetcher: async (url, options) => {
    assert.equal(url, "https://api.example.test/api/v1/memories");
    assert.equal(options?.method, "GET");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer account-token");
    assert.equal(options?.body, undefined);
    return new Response(JSON.stringify({ success: true, data: { items: [memory], total: 1 } }));
  } });
  assert.deepEqual(await api.list("account-token"), { items: [memory], total: 1 });
});

test("only a valid server empty list is treated as empty; HTTP and malformed responses reject", async () => {
  const responses = [
    new Response("{}", { status: 401 }),
    new Response("{}", { status: 404 }),
    new Response("{}", { status: 503 }),
    new Response(JSON.stringify({ success: true, data: { items: [{ ...memory, thumbnail_url: "file:///fake.jpg" }], total: 1 } })),
    new Response(JSON.stringify({ success: true, data: { items: [memory] } })),
  ];
  for (const response of responses) {
    const api = createMemoryApi({ baseUrl: "https://api.example.test", fetcher: async () => response });
    await assert.rejects(api.list("token"), (error) => error instanceof MemoryApiError);
  }
  const api = createMemoryApi({ baseUrl: "https://api.example.test", fetcher: async () => new Response(JSON.stringify({ success: true, data: { items: [], total: 0 } })) });
  assert.deepEqual(await api.list("token"), { items: [], total: 0 });
});

test("feed network failures and deadlines never return invented posts", async () => {
  const offline = createMemoryApi({ baseUrl: "https://api.example.test", fetcher: async () => { throw new TypeError("offline"); } });
  await assert.rejects(offline.list("token"), (error) => error instanceof MemoryApiError && error.code === "network");
  const slow = createMemoryApi({ baseUrl: "https://api.example.test", timeoutMs: 5, fetcher: async (_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  }) });
  await assert.rejects(slow.list("token"), (error) => error instanceof MemoryApiError && error.code === "timeout");
});
