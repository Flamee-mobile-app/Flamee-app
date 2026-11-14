import assert from "node:assert/strict";
import test from "node:test";
import { getMemoryPhotoPreview, reuseMemoryCover } from "./memoryPhotoModel.ts";

const cover = { id: "photo-1", url: "https://media.example.test/cover.jpg?token=old", thumbnail_url: "https://media.example.test/thumb.jpg", width: 1600, height: 1200, url_expires_at: 2000 };
const summary = { id: "memory-1", title: "Our day", category: "moment", memory_date: "2026-10-18", location: null, is_pinned: false, image_count: 2, thumbnail_url: cover.thumbnail_url, cover_image: cover };
const detail = { id: summary.id, title: summary.title, description: null, memory_date: summary.memory_date, location: null, images: [{ ...cover, url: "https://media.example.test/cover.jpg?token=new" }, { id: "photo-2", url: "https://media.example.test/second.jpg", width: 800, height: 600 }] };

test("detail can show the confirmed feed cover immediately before its API finishes", () => {
  assert.deepEqual(getMemoryPhotoPreview(summary, 1000)?.images, [cover]);
  assert.equal(getMemoryPhotoPreview({ ...summary, cover_image: undefined }, 1000), null);
  assert.equal(getMemoryPhotoPreview(summary, 2100), null);
});

test("detail reuses the same unexpired image URL to avoid downloading the cover again", () => {
  const result = reuseMemoryCover(detail, summary, 1000);
  assert.equal(result.images[0].url, cover.url);
  assert.equal(result.images[1].url, detail.images[1].url);
  assert.equal(detail.images[0].url, "https://media.example.test/cover.jpg?token=new");
});

test("fresh detail replaces expired or mismatched preview URLs", () => {
  assert.equal(reuseMemoryCover(detail, summary, 2100), detail);
  assert.equal(reuseMemoryCover(detail, { ...summary, id: "another-memory" }, 1000), detail);
  assert.equal(reuseMemoryCover(detail, { ...summary, cover_image: { ...cover, id: "removed-photo" } }, 1000).images[0].url, detail.images[0].url);
});
