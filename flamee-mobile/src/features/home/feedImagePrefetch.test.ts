import assert from "node:assert/strict";
import test from "node:test";
import { createImagePrefetchQueue, selectFeedPrefetchUrls } from "./feedImagePrefetch.ts";
import type { MemorySummary } from "../moments/memoryApi.ts";

test("prefetch prioritizes small upcoming previews and bounds the full-size lookahead", () => {
  const feed: MemorySummary[] = Array.from({ length: 12 }, (_, i) => ({ id: String(i), title: "", category: "moment", memory_date: "2026-11-16", location: null, is_pinned: false, image_count: 1, thumbnail_url: `thumb${i}`, cover_image: { id: String(i), url: `full${i}`, width: 1, height: 1 } }));
  assert.deepEqual(selectFeedPrefetchUrls(feed, 2, 3), ["thumb4", "thumb5", "thumb6", "thumb7", "full4", "full5"]);
});
test("prefetch queue limits concurrency, replaces obsolete work, deduplicates and stops on disposal", async () => {
  const reads: string[] = [];
  const pending: (() => void)[] = [];
  const queue = createImagePrefetchQueue((uri) => { reads.push(uri); return new Promise<boolean>((resolve) => pending.push(() => resolve(true))); });
  queue.enqueue(["a", "a", "b", "c", "d"]);
  assert.deepEqual(reads, ["a", "b"]);
  queue.enqueue(["a", "b", "new"]);
  pending.shift()!();
  await new Promise((done) => setTimeout(done, 0));
  assert.deepEqual(reads, ["a", "b", "new"]);
  queue.dispose();
  pending.splice(0).forEach((finish) => finish());
  queue.enqueue(["never"]);
  await new Promise((done) => setTimeout(done, 0));
  assert.deepEqual(reads, ["a", "b", "new"]);
});

test("rapid blur and focus preserve unresolved requests rather than starting duplicate downloads", async () => {
  const reads: string[] = [];
  const pending: (() => void)[] = [];
  const queue = createImagePrefetchQueue((uri) => { reads.push(uri); return new Promise<boolean>((resolve) => pending.push(() => resolve(true))); });
  queue.enqueue(["a", "b", "obsolete"]);
  queue.setActive(false);
  queue.enqueue(["hidden"]);
  queue.setActive(true);
  queue.enqueue(["a", "b", "next"]);
  assert.deepEqual(reads, ["a", "b"]);
  pending.shift()!();
  await new Promise((done) => setTimeout(done, 0));
  assert.deepEqual(reads, ["a", "b", "next"]);
  queue.dispose(); pending.splice(0).forEach((finish) => finish());
});
