import { infiniteQueryOptions, queryOptions, replaceEqualDeep, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import type { MemoryDetail, MemoryList, MemorySummary } from "./memoryApi.ts";

/** These IDs partition the in-memory cache; the API still authorizes every read. */
export type MemoryScope = { accountId: string | null; coupleId: string | null; sessionId: number };
const memoryFreshnessMs = 30_000;
const scopeKey = (scope: MemoryScope) => ["memories", scope.sessionId, scope.accountId, scope.coupleId] as const;
export const memoryQueryKeys = {
  scope: scopeKey,
  feed: (scope: MemoryScope) => [...scopeKey(scope), "feed"] as const,
  detail: (scope: MemoryScope, id: string) => [...scopeKey(scope), "detail", id] as const,
};

export function refreshStaleMemoryQueries(client: QueryClient, scope: MemoryScope) {
  return client.refetchQueries({ queryKey: memoryQueryKeys.scope(scope), type: "active", predicate: (query) => query.isStaleByTime(memoryFreshnessMs) }, { cancelRefetch: false });
}

function sameSignedObject(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return a === b;
  try {
    const left = new URL(a); const right = new URL(b);
    if (!left.pathname.includes("/storage/v1/object/sign/") || !left.searchParams.has("token") || !right.searchParams.has("token")) return a === b;
    left.searchParams.delete("token"); right.searchParams.delete("token");
    return left.toString() === right.toString();
  } catch { return a === b; }
}

type Photo = MemoryDetail["images"][number];
function retainValidPhoto(previous: Photo | null | undefined, current: Photo): Photo {
  if (!previous || previous.id !== current.id || !previous.url_expires_at || previous.url_expires_at * 1000 <= Date.now() + memoryFreshnessMs
    || !sameSignedObject(previous.url, current.url) || !sameSignedObject(previous.thumbnail_url, current.thumbnail_url)) return current;
  return { ...current, url: previous.url, thumbnail_url: previous.thumbnail_url, url_expires_at: previous.url_expires_at };
}

function retainValidCover(old: MemorySummary | undefined, next: MemorySummary): MemorySummary {
  if (!old?.cover_image || !next.cover_image || !sameSignedObject(old.thumbnail_url, next.thumbnail_url)) return next;
  const cover = retainValidPhoto(old.cover_image, next.cover_image);
  if (cover === next.cover_image) return next;
  return { ...next, thumbnail_url: old.thumbnail_url, cover_image: cover };
}

export function memoryFeedOptions(scope: MemoryScope, read: (page: { limit: number; offset: number }, signal: AbortSignal) => Promise<MemoryList>, retainUrls = () => true) {
  return infiniteQueryOptions({
    queryKey: memoryQueryKeys.feed(scope),
    queryFn: ({ pageParam, signal }) => read({ limit: 24, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last, _pages, lastOffset) => {
      const next = lastOffset + last.items.length;
      return last.items.length > 0 && (last.has_more ?? next < last.total) ? next : undefined;
    },
    staleTime: memoryFreshnessMs,
    structuralSharing: (oldData, newData) => {
      const oldFeed = oldData as InfiniteData<MemoryList, number> | undefined;
      const newFeed = newData as InfiniteData<MemoryList, number>;
      if (!oldFeed || !retainUrls()) return replaceEqualDeep(oldData, newData);
      const oldItems = new Map(oldFeed.pages.flatMap((page) => page.items.map((item) => [item.id, item])));
      return replaceEqualDeep(oldData, { ...newFeed, pages: newFeed.pages.map((page) => ({ ...page, items: page.items.map((item) => retainValidCover(oldItems.get(item.id), item)) })) });
    },
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function memoryDetailOptions(scope: MemoryScope, id: string, read: (id: string, signal: AbortSignal) => Promise<MemoryDetail>, retainUrls = () => true) {
  return queryOptions({
    queryKey: memoryQueryKeys.detail(scope, id),
    queryFn: ({ signal }) => read(id, signal),
    staleTime: memoryFreshnessMs,
    structuralSharing: (oldData, newData) => {
      const old = oldData as MemoryDetail | undefined;
      const next = newData as MemoryDetail;
      if (!old || old.id !== next.id || !retainUrls()) return replaceEqualDeep(oldData, newData);
      const photos = new Map(old.images.map((photo) => [photo.id, photo]));
      return replaceEqualDeep(oldData, { ...next, images: next.images.map((photo) => retainValidPhoto(photos.get(photo.id), photo)) });
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/** Called synchronously by the session subscription before another scope can render. */
export function pruneMemoryQueries(client: QueryClient, scope: MemoryScope) {
  const current = scopeKey(scope);
  const filters = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === "memories" && (!scope.accountId || !scope.coupleId || current.some((value, index) => query.queryKey[index] !== value)) };
  void client.cancelQueries(filters);
  client.removeQueries(filters);
}

