import { infiniteQueryOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import type { ServerMood, ServerPartnerMood } from "./moodApi.ts";

export type MoodHistoryScope = { accountId: string | null; sessionId: number };
export function moodHistoryOptions(scope: MoodHistoryScope, read: (page: { limit: number; offset: number }, signal: AbortSignal) => Promise<ServerMood[]>) {
  return infiniteQueryOptions({
    queryKey: ["mood-history", scope.sessionId, scope.accountId],
    queryFn: ({ pageParam, signal }) => read({ limit: 50, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last, _pages, offset) => last.length === 50 ? offset + last.length : undefined,
    retry: false, staleTime: 30_000,
  });
}
export function partnerMoodOptions(scope: MoodHistoryScope & { coupleId: string | null }, read: (signal: AbortSignal) => Promise<ServerPartnerMood>) {
  return queryOptions({ queryKey: ["partner-mood", scope.sessionId, scope.accountId, scope.coupleId], queryFn: ({ signal }) => read(signal), staleTime: 0, retry: false });
}
export function pruneMoodHistory(client: QueryClient, scope: MoodHistoryScope & { coupleId?: string | null }) {
  const filters = { predicate: (query: { queryKey: readonly unknown[] }) => ["mood-history", "partner-mood"].includes(String(query.queryKey[0])) && (!scope.accountId || query.queryKey[1] !== scope.sessionId || query.queryKey[2] !== scope.accountId || (query.queryKey[0] === "partner-mood" && query.queryKey[3] !== scope.coupleId)) };
  void client.cancelQueries(filters);
  client.removeQueries(filters);
}
