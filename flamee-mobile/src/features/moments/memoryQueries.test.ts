import assert from "node:assert/strict";
import test from "node:test";
import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { memoryDetailOptions, memoryFeedOptions, memoryQueryKeys, pruneMemoryQueries, type MemoryScope } from "./memoryQueries.ts";
import type { MemoryDetail, MemoryList, MemorySummary } from "./memoryApi.ts";

const scope: MemoryScope = { accountId: "account-a", coupleId: "couple-a", sessionId: 1 };
const memory = (id: string): MemorySummary => ({ id, title: id, category: "moment", memory_date: "2026-10-19", location: null, is_pinned: false, thumbnail_url: null, image_count: 0 });
const page = (ids: string[], offset: number, hasMore: boolean): MemoryList => ({ items: ids.map(memory), total: 3, offset, limit: 2, has_more: hasMore });
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

test("fresh Home focus reads share one request and reuse the confirmed cache", async () => {
  const cache = client();
  let reads = 0;
  const options = memoryFeedOptions(scope, async () => { reads++; return page(["one", "two"], 0, true); });
  await Promise.all([cache.fetchInfiniteQuery(options), cache.fetchInfiniteQuery(options)]);
  await cache.fetchInfiniteQuery(options);
  assert.equal(reads, 1);
  cache.clear();
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
