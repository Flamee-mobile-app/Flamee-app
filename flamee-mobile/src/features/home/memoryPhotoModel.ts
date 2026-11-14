import type { MemoryDetail, MemorySummary } from "../moments/memoryApi.ts";

function freshCover(summary: MemorySummary, now: number) {
  const photo = summary.cover_image;
  // Only reuse a signed URL while it has a safe remaining lifetime.
  return photo?.url_expires_at && photo.url_expires_at > now + 30 ? photo : null;
}

/** A confirmed cover preview, not a claim that the complete album has loaded. */
export function getMemoryPhotoPreview(summary: MemorySummary, now = Date.now() / 1000): MemoryDetail | null {
  const cover = freshCover(summary, now);
  return cover ? {
    id: summary.id, title: summary.title, description: summary.description ?? null,
    memory_date: summary.memory_date, location: summary.location, images: [cover],
  } : null;
}

/** Keep the exact URL already displayed by the feed; never rewrite Storage URLs. */
export function reuseMemoryCover(detail: MemoryDetail, summary: MemorySummary, now = Date.now() / 1000): MemoryDetail {
  const cover = detail.id === summary.id ? freshCover(summary, now) : null;
  if (!cover) return detail;
  return { ...detail, images: detail.images.map((photo) => photo.id === cover.id ? { ...photo, url: cover.url, thumbnail_url: cover.thumbnail_url, url_expires_at: cover.url_expires_at } : photo) };
}
