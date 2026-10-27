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

test("paged feed preserves server pagination and author identity without client-generated names", async () => {
  const record = { ...memory, description: "A real caption", created_by: "user-one", created_at: "2026-10-18T09:00:00Z", author: { id: "user-one", full_name: "An", username: "Biệt danh", avatar_url: "https://media.example.test/avatar.jpg" } };
  const payload = { items: [record], total: 60, offset: 24, limit: 24, has_more: true };
  const api = createMemoryApi({ baseUrl: "https://api.example.test/api/v1", fetcher: async (url) => {
    assert.equal(url, "https://api.example.test/api/v1/memories?limit=24&offset=24");
    return new Response(JSON.stringify({ success: true, data: payload }));
  } });
  assert.deepEqual(await api.list("token", { limit: 24, offset: 24 }), payload);
});

test("memory detail reads original images only when requested and rejects local media URLs", async () => {
  const record = { id: "memory-1", title: "Memory", description: null, memory_date: "2026-10-18", location: null, images: [{ id: "image-1", url: "https://media.example.test/original.jpg", width: 1600, height: 1200 }] };
  const api = createMemoryApi({ baseUrl: "https://api.example.test/api/v1", fetcher: async (url, options) => {
    assert.equal(url, "https://api.example.test/api/v1/memories/memory-1");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer token");
    return new Response(JSON.stringify({ success: true, data: record }));
  } });
  assert.deepEqual(await api.detail("token", "memory-1"), record);
  const invalid = createMemoryApi({ baseUrl: "https://api.example.test", fetcher: async () => new Response(JSON.stringify({ success: true, data: { ...record, images: [{ ...record.images[0], url: "file:///local.jpg" }] } })) });
  await assert.rejects(invalid.detail("token", "memory-1"), (error) => error instanceof MemoryApiError && error.code === "response");
});

test("feed preserves a server-signed sharp cover for reuse and rejects invalid cover URLs", async () => {
  const cover = { id: "photo-1", url: "https://media.example.test/original.jpg", thumbnail_url: memory.thumbnail_url, width: 1600, height: 1200, url_expires_at: 2_000_000_000 };
  const api = createMemoryApi({ baseUrl: "https://api.example.test", fetcher: async () => new Response(JSON.stringify({ success: true, data: { items: [{ ...memory, cover_image: cover }], total: 1 } })) });
  assert.deepEqual((await api.list("token")).items[0].cover_image, cover);
  const invalid = createMemoryApi({ baseUrl: "https://api.example.test", fetcher: async () => new Response(JSON.stringify({ success: true, data: { items: [{ ...memory, cover_image: { ...cover, url: "file:///private.jpg" } }], total: 1 } })) });
  await assert.rejects(invalid.list("token"), (error) => error instanceof MemoryApiError && error.code === "response");
});

test("create memory sends JSON and an idempotency key and validates the server owner", async () => {
  const record = { id: "memory-1", title: "Memory", description: null, memory_date: "2026-10-18", location: null, images: [], created_by: "user-one" };
  const api = createMemoryApi({ baseUrl: "https://api.example.test/api/v1", fetcher: async (url, options) => {
    assert.equal(url, "https://api.example.test/api/v1/memories");
    assert.equal(options?.method, "POST");
    assert.equal(new Headers(options?.headers).get("Idempotency-Key"), "stable-key");
    assert.equal(JSON.parse(String(options?.body)).title, "Memory");
    return new Response(JSON.stringify({ success: true, data: record }), { status: 201 });
  } });
  assert.deepEqual(await api.create("token", { title: "Memory", category: "moment", memory_date: "2026-10-18" }, "stable-key"), record);
});

test("photo upload uses a byte-backed multipart File adapter without setting a JSON content type", async () => {
  const bytes = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });
  const api = createMemoryApi({ baseUrl: "https://api.example.test/api/v1", fileFromUri: () => bytes, fetcher: async (url, options) => {
    assert.equal(url, "https://api.example.test/api/v1/memories/memory-1/images");
    assert.equal(options?.method, "POST");
    assert.equal(new Headers(options?.headers).get("Content-Type"), null);
    assert.equal(new Headers(options?.headers).get("Idempotency-Key"), "stable-key");
    assert.ok(options?.body instanceof FormData);
    const file = options.body.get("file");
    assert.ok(file instanceof Blob);
    assert.deepEqual(new Uint8Array(await file.arrayBuffer()), new Uint8Array([1, 2, 3]));
    return new Response(JSON.stringify({ success: true, data: { id: "image-1", url: "https://media.example.test/image.jpg", thumbnail_url: "https://media.example.test/thumb.jpg" } }), { status: 201 });
  } });
  const result = await api.upload("token", "memory-1", { uri: "file:///photo.jpg", name: "memory.jpg", type: "image/jpeg" }, "stable-key");
  assert.equal(result.id, "image-1");
});

test("a 201 upload without readable server image URLs is not a successful upload", async () => {
  const api = createMemoryApi({ baseUrl: "https://api.example.test", fetcher: async () => new Response(JSON.stringify({ success: true, data: { id: "image", url: null, thumbnail_url: null } }), { status: 201 }) });
  await assert.rejects(api.upload("token", "memory", new Blob(["bytes"]), "key"), (error) => error instanceof MemoryApiError && error.code === "response");
});

test("external query cancellation reaches fetch and is not reported as a timeout", async () => {
  const controller = new AbortController();
  let requestSignal: AbortSignal | null | undefined;
  const api = createMemoryApi({ baseUrl: "https://api.example.test", fetcher: async (_url, options) => {
    requestSignal = options?.signal;
    return new Promise<Response>((_resolve, reject) => options?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
  } });
  const pending = api.list("token", { limit: 2, offset: 0 }, controller.signal);
  controller.abort();
  await assert.rejects(pending, (error) => error instanceof Error && error.name === "AbortError");
  assert.equal(requestSignal?.aborted, true);
});
