import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { memoryFeedOptions, memoryQueryKeys, memoryService, type MemoryScope, type MemorySummary } from "../moments";

export function useHomeMemories(scope: MemoryScope, bootstrapped: boolean) {
  const client = useQueryClient();
  const query = useInfiniteQuery({ ...memoryFeedOptions(scope, memoryService.list), enabled: bootstrapped && Boolean(scope.accountId && scope.coupleId) });
  const records = useMemo(() => {
    const unique = new Map<string, MemorySummary>();
    query.data?.pages.forEach((page) => page.items.forEach((record) => unique.set(record.id, record)));
    return [...unique.values()];
  }, [query.data]);
  const invalidate = useCallback(() => client.invalidateQueries({ queryKey: memoryQueryKeys.feed(scope) }), [client, scope]);
  return { query, records, invalidate };
}
