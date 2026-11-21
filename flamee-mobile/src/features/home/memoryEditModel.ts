import type { InfiniteData } from "@tanstack/react-query";
import type { MemoryDetail, MemoryList } from "../moments/memoryApi.ts";

export function reconcileMemoryEdit(feed: InfiniteData<MemoryList, number> | undefined, saved: MemoryDetail, mediaChanged = false) {
  if (!feed) return feed;
  return { ...feed, pages: feed.pages.map((page) => ({ ...page, items: page.items.map((item) => item.id === saved.id ? {
    ...item, title: saved.title, description: saved.description, memory_date: saved.memory_date, location: saved.location,
    ...(mediaChanged ? { image_count: saved.images.length, cover_image: saved.images[0] ?? null, thumbnail_url: saved.images[0]?.thumbnail_url ?? saved.images[0]?.url ?? null } : {}),
  } : item) })) };
}
export function reconcileMemoryDeletion(feed: InfiniteData<MemoryList, number> | undefined, id: string) {
  if (!feed || !feed.pages.some((page) => page.items.some((item) => item.id === id))) return feed;
  return { ...feed, pages: feed.pages.map((page) => ({ ...page, total: Math.max(0, page.total - 1), items: page.items.filter((item) => item.id !== id) })) };
}
