import assert from "node:assert/strict";
import test from "node:test";
import { InfiniteQueryObserver, QueryClient, QueryObserver } from "@tanstack/react-query";
import { memoryDetailOptions, memoryFeedOptions, memoryQueryKeys, pruneMemoryQueries, refreshStaleMemoryQueries, type MemoryScope } from "./memoryQueries.ts";
import type { MemoryDetail, MemoryList, MemorySummary } from "./memoryApi.ts";

const scope: MemoryScope = { accountId: "account-a", coupleId: "couple-a", sessionId: 1 };
const memory = (id: string): MemorySummary => ({ id, title: id, category: "moment", memory_date: "2026-10-19", location: null, is_pinned: false, thumbnail_url: null, image_count: 0 });
const page = (ids: string[], offset: number, hasMore: boolean): MemoryList => ({ items: ids.map(memory), total: 3, offset, limit: 2, has_more: hasMore });
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

test("Home retains a still-valid avatar URL across background refresh and accepts replacement, removal and expiry", async () => {
  const cache = client();
  const expiry = Math.floor(Date.now() / 1000) + 600;
  const signed = (path: string, exp: number) => `https://example.test/storage/v1/object/sign/media/${path}?token=x.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.x`;
  let uri: string | null = signed("avatar.jpg", expiry);
  const oldUri = uri;
  const options = memoryFeedOptions(scope, async () => ({ items: [{ ...memory("one"), author: { id: "a", full_name: "A", avatar_url: uri } }], total: 1 }));
  await cache.fetchInfiniteQuery(options);
  const observer = new InfiniteQueryObserver(cache, options);
  uri = signed("avatar.jpg", expiry + 600);
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data!.pages[0].items[0].author?.avatar_url, oldUri);
  const now = Date.now;
  try {
    Date.now = () => (expiry - 1) * 1000;
    await observer.refetch();
    assert.equal(observer.getCurrentResult().data!.pages[0].items[0].author?.avatar_url, uri);
  } finally { Date.now = now; }
  uri = signed("replacement.jpg", expiry + 600);
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data!.pages[0].items[0].author?.avatar_url, uri);
  uri = null;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data!.pages[0].items[0].author?.avatar_url, null);
  observer.destroy(); cache.clear();
});

test("fresh Home focus reads share one request and reuse the confirmed cache", async () => {
  const cache = client();
  let reads = 0;
  const options = memoryFeedOptions(scope, async () => { reads++; return page(["one", "two"], 0, true); });
  await Promise.all([cache.fetchInfiniteQuery(options), cache.fetchInfiniteQuery(options)]);
  await cache.fetchInfiniteQuery(options);
  assert.equal(reads, 1);
  cache.clear();
});

test("returning to Home refreshes only active, stale memory data", async () => {
  const cache = client();
  let feedReads = 0;
  let detailReads = 0;
  const feed = memoryFeedOptions(scope, async () => { feedReads++; return page(["one"], 0, false); });
  const detail = memoryDetailOptions(scope, "one", async () => { detailReads++; return { id: "one", title: "one", description: null, location: null, memory_date: "2026-10-19", images: [] }; });
  await cache.fetchInfiniteQuery(feed);
  await cache.fetchQuery(detail);
  const observer = new InfiniteQueryObserver(cache, feed);
  const unsubscribe = observer.subscribe(() => undefined);
  const now = Date.now;
  try {
    Date.now = () => now() + 29_000;
    await refreshStaleMemoryQueries(cache, scope);
    assert.equal(feedReads, 1);
    Date.now = () => now() + 31_000;
    await refreshStaleMemoryQueries(cache, scope);
    assert.equal(feedReads, 2);
    assert.equal(detailReads, 1);
  } finally { Date.now = now; unsubscribe(); observer.destroy(); cache.clear(); }
});

test("a stale cached feed does not refetch on screen remount before explicit refresh", async () => {
  const cache = client();
  let reads = 0;
  const options = memoryFeedOptions(scope, async () => { reads++; return page(["one"], 0, false); });
  await cache.fetchInfiniteQuery(options);
  const originalNow = Date.now;
  try {
    Date.now = () => originalNow() + 31_000;
    const observer = new InfiniteQueryObserver(cache, options);
    const unsubscribe = observer.subscribe(() => undefined);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(reads, 1);
    await observer.refetch();
    assert.equal(reads, 2);
    unsubscribe(); observer.destroy(); cache.clear();
  } finally {
    Date.now = originalNow;
    cache.clear();
  }
});

test("refresh retains accumulated pages while pending and after a failed refresh", async () => {
  const cache = client();
  let fail = false;
  const options = { ...memoryFeedOptions(scope, async ({ offset }) => {
    if (fail) throw new Error("offline");
    return offset === 0 ? page(["one", "two"], 0, true) : page(["three"], 2, false);
  }), retry: false as const };
  await cache.fetchInfiniteQuery(options);
  const observer = new InfiniteQueryObserver(cache, options);
  await observer.fetchNextPage();
  const before = cache.getQueryData(options.queryKey);
  fail = true;
  const refresh = observer.refetch();
  assert.deepEqual(cache.getQueryData(options.queryKey), before);
  await refresh;
  assert.deepEqual(cache.getQueryData(options.queryKey), before);
  assert.equal(observer.getCurrentResult().data?.pages.length, 2);
  observer.destroy(); cache.clear();
});

test("successful refresh updates every loaded page without resetting history to page one", async () => {
  const cache = client();
  let updated = false;
  const offsets: number[] = [];
  const options = memoryFeedOptions(scope, async ({ offset }) => {
    offsets.push(offset);
    return offset === 0 ? page([updated ? "new" : "one", "two"], 0, true) : page(["three"], 2, false);
  });
  await cache.fetchInfiniteQuery(options);
  const observer = new InfiniteQueryObserver(cache, options);
  await observer.fetchNextPage();
  updated = true;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data?.pages.length, 2);
  assert.equal(observer.getCurrentResult().data?.pages[0].items[0].id, "new");
  assert.deepEqual(offsets, [0, 2, 0, 2]);
  observer.destroy(); cache.clear();
});

test("background refresh retains valid signed cover URLs while accepting changed content and newer URLs near expiry", async () => {
  const cache = client();
  const expiry = Math.floor(Date.now() / 1000) + 600;
  let version = 0;
  const url = (token: string) => `https://storage.example/storage/v1/object/sign/media/photo?token=${token}`;
  const options = memoryFeedOptions(scope, async () => ({ items: [{ ...memory("one"), title: `version ${version}`, thumbnail_url: url(`thumb${version}`), image_count: 1, cover_image: { id: "image-a", url: url(`cover${version}`), thumbnail_url: url(`thumb${version}`), width: 10, height: 10, url_expires_at: version === 0 ? expiry : expiry + 600 } }], total: 1 }));
  await cache.fetchInfiniteQuery(options);
  const observer = new InfiniteQueryObserver(cache, options);
  version = 1;
  await observer.refetch();
  const retained = observer.getCurrentResult().data!.pages[0].items[0];
  assert.equal(retained.title, "version 1");
  assert.equal(retained.cover_image?.url, url("cover0"));
  assert.equal(retained.thumbnail_url, url("thumb0"));
  const realNow = Date.now;
  try {
    Date.now = () => (expiry - 1) * 1000;
    version = 2;
    await observer.refetch();
    assert.equal(observer.getCurrentResult().data!.pages[0].items[0].cover_image?.url, url("cover2"));
  } finally { Date.now = realNow; observer.destroy(); cache.clear(); }
});

test("cover replacement and explicit refresh use newly returned URLs", async () => {
  const cache = client();
  let version = 0;
  let retain = true;
  const url = (token: string) => `https://storage.example/storage/v1/object/sign/media/photo?token=${token}`;
  const options = memoryFeedOptions(scope, async () => ({ items: [{ ...memory("one"), image_count: 1, thumbnail_url: url(`thumb${version}`), cover_image: { id: version < 2 ? "old" : "new", url: url(`cover${version}`), thumbnail_url: url(`thumb${version}`), width: 10, height: 10, url_expires_at: Math.floor(Date.now() / 1000) + 600 } }], total: 1 }), () => retain);
  await cache.fetchInfiniteQuery(options);
  const observer = new InfiniteQueryObserver(cache, options);
  version = 1; retain = false;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data!.pages[0].items[0].cover_image?.url, url("cover1"));
  version = 2; retain = true;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data!.pages[0].items[0].cover_image?.url, url("cover2"));
  observer.destroy(); cache.clear();
});

test("scope switch aborts outstanding reads and removes private feed/detail cache", async () => {
  const cache = client();
  let signal: AbortSignal | undefined;
  const pending = cache.fetchInfiniteQuery(memoryFeedOptions(scope, async (_page, requestSignal) => {
    signal = requestSignal;
    return new Promise<MemoryList>((_resolve, reject) => requestSignal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
  })).catch(() => undefined);
  cache.setQueryData(memoryQueryKeys.detail(scope, "one"), { id: "one" });
  const next = { ...scope, coupleId: "couple-b" };
  cache.setQueryData(memoryQueryKeys.feed(next), { pages: [] });
  pruneMemoryQueries(cache, next);
  assert.equal(signal?.aborted, true);
  assert.equal(cache.getQueryData(memoryQueryKeys.detail(scope, "one")), undefined);
  assert.equal(cache.getQueryData(memoryQueryKeys.feed(scope)), undefined);
  assert.deepEqual(cache.getQueryData(memoryQueryKeys.feed(next)), { pages: [] });
  await pending; cache.clear();
});

test("another login of the same account has a separate memory scope", () => {
  assert.notDeepEqual(memoryQueryKeys.feed(scope), memoryQueryKeys.feed({ ...scope, sessionId: 2 }));
});

test("detail errors retain the confirmed album so retry does not blank every photo", async () => {
  const cache = client();
  const confirmed: MemoryDetail = { id: "one", title: "one", description: null, location: null, memory_date: "2026-10-19", images: [] };
  let fail = false;
  const options = { ...memoryDetailOptions(scope, "one", async () => { if (fail) throw new Error("offline"); return confirmed; }), retry: false as const };
  await cache.fetchQuery(options);
  fail = true;
  await assert.rejects(cache.fetchQuery({ ...options, staleTime: 0 }));
  assert.deepEqual(cache.getQueryData(options.queryKey), confirmed);
  cache.clear();
});

test("background detail refresh keeps each valid signed photo while preserving changed content and explicit retries", async () => {
  const cache = client();
  let version = 0;
  let retain = true;
  const signed = (name: string) => `https://storage.example/storage/v1/object/sign/media/${name}?token=${version}`;
  const options = memoryDetailOptions(scope, "one", async () => ({ id: "one", title: `title ${version}`, description: null, location: null, memory_date: "2026-10-19", images: ["first", "second"].map((id) => ({ id, url: signed(id), thumbnail_url: signed(`${id}-thumb`), width: 10, height: 10, url_expires_at: Math.floor(Date.now() / 1000) + 600 })) }), () => retain);
  await cache.fetchQuery(options);
  const observer = new QueryObserver(cache, options);
  version = 1;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data?.title, "title 1");
  assert.deepEqual(observer.getCurrentResult().data?.images.map((photo) => photo.url), [signed("first").replace("=1", "=0"), signed("second").replace("=1", "=0")]);
  retain = false; version = 2;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data?.images[1].url, signed("second"));
  observer.destroy(); cache.clear();
});

test("memory reads expose one failed deadline without the provider's automatic retry", async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: 1, retryDelay: 0, gcTime: Infinity } } });
  let feeds = 0;
  let details = 0;
  await assert.rejects(cache.fetchInfiniteQuery(memoryFeedOptions(scope, async () => { feeds++; throw new Error("timeout"); })));
  await assert.rejects(cache.fetchQuery(memoryDetailOptions(scope, "one", async () => { details++; throw new Error("timeout"); })));
  assert.equal(feeds, 1);
  assert.equal(details, 1);
  cache.clear();
});
