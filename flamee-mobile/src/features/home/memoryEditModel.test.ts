import assert from "node:assert/strict";
import test from "node:test";
import { reconcileMemoryEdit, reconcileMemoryDeletion } from "./memoryEditModel.ts";
import type { MemoryList, MemoryDetail } from "../moments/memoryApi.ts";
import type { InfiniteData } from "@tanstack/react-query";

const item = (id: string) => ({ id, title: "Old", category: "moment", memory_date: "2026-11-16", location: null, description: "Before", is_pinned: false, thumbnail_url: "https://example.test/photo", image_count: 2 });
const feed: InfiniteData<MemoryList, number> = { pages: [{ items: [item("a")], total: 2 }, { items: [item("b")], total: 2 }], pageParams: [0, 1] };
test("confirmed edit updates the posted card while retaining media, other pages and server metadata", () => {
  const ack: MemoryDetail = { id: "a", title: "Saved", description: null, memory_date: "2026-11-16", location: null, images: [] };
  const next = reconcileMemoryEdit(feed, ack)!;
  assert.equal(next.pages[0].items[0].title, "Saved");
  assert.equal(next.pages[0].items[0].description, null);
  assert.equal(next.pages[0].items[0].image_count, 2);
  assert.equal(next.pages[0].items[0].thumbnail_url, feed.pages[0].items[0].thumbnail_url);
  assert.deepEqual(next.pages[1], feed.pages[1]);
  assert.equal(feed.pages[0].items[0].title, "Old");
});
test("confirmed deletion removes only its post and a repeated acknowledgement cannot decrement counts twice", () => {
  const next = reconcileMemoryDeletion(feed, "a")!;
  assert.deepEqual(next.pages.flatMap((page) => page.items.map((post) => post.id)), ["b"]);
  assert.equal(next.pages[0].total, 1);
  assert.deepEqual(reconcileMemoryDeletion(next, "a"), next);
  assert.equal(reconcileMemoryEdit(undefined, {} as MemoryDetail), undefined);
});
