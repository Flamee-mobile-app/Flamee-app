import { infiniteQueryOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import type { MemoryDetail, MemoryList } from "./memoryApi.ts";

/** These IDs partition the in-memory cache; the API still authorizes every read. */
export type MemoryScope = { accountId: string | null; coupleId: string | null; sessionId: number };
const memoryFreshnessMs = 30_000;
const scopeKey = (scope: MemoryScope) => ["memories", scope.sessionId, scope.accountId, scope.coupleId] as const;
export const memoryQueryKeys = {
  scope: scopeKey,
  feed: (scope: MemoryScope) => [...scopeKey(scope), "feed"] as const,
  detail: (scope: MemoryScope, id: string) => [...scopeKey(scope), "detail", id] as const,
};

export function memoryFeedOptions(scope: MemoryScope, read: (page: { limit: number; offset: number }, signal: AbortSignal) => Promise<MemoryList>) {
  return infiniteQueryOptions({
    queryKey: memoryQueryKeys.feed(scope),
    queryFn: ({ pageParam, signal }) => read({ limit: 24, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last, _pages, lastOffset) => {
      const next = lastOffset + last.items.length;
      return last.items.length > 0 && (last.has_more ?? next < last.total) ? next : undefined;
    },
    staleTime: memoryFreshnessMs,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function memoryDetailOptions(scope: MemoryScope, id: string, read: (id: string, signal: AbortSignal) => Promise<MemoryDetail>) {
  return queryOptions({
    queryKey: memoryQueryKeys.detail(scope, id),
    queryFn: ({ signal }) => read(id, signal),
    staleTime: memoryFreshnessMs,
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

