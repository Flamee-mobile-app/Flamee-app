import { useCallback, useEffect, useMemo } from "react";
import { AppState } from "react-native";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { memoryFeedOptions, memoryQueryKeys, memoryService, type MemoryScope, type MemorySummary } from "../moments";
import { createMemorySync } from "./memorySync";
import { useSessionStore } from "../../shared/state/sessionStore";

export function useHomeMemories(scope: MemoryScope, bootstrapped: boolean, focused: boolean) {
  const client = useQueryClient();
  const query = useInfiniteQuery({ ...memoryFeedOptions(scope, memoryService.list), enabled: bootstrapped && Boolean(scope.accountId && scope.coupleId) });
  const records = useMemo(() => {
    const unique = new Map<string, MemorySummary>();
    query.data?.pages.forEach((page) => page.items.forEach((record) => unique.set(record.id, record)));
    return [...unique.values()];
  }, [query.data]);
  const invalidate = useCallback(() => client.invalidateQueries({ queryKey: memoryQueryKeys.feed(scope) }), [client, scope]);
  useEffect(() => {
    if (!bootstrapped || !focused || !scope.accountId || !scope.coupleId) return;
    const sync = createMemorySync(async () => {
      const queryKey = memoryQueryKeys.scope(scope);
      if (client.isFetching({ queryKey })) return;
      await client.invalidateQueries({ queryKey });
    }, () => {
      const current = useSessionStore.getState();
      return AppState.currentState === "active" && current.activeAccountId === scope.accountId
        && current.activeCoupleId === scope.coupleId && current.sessionId === scope.sessionId;
    });
    void sync.tick();
    const timer = setInterval(() => { void sync.tick(); }, 5_000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void sync.tick(); });
    return () => { sync.dispose(); clearInterval(timer); subscription.remove(); };
  }, [client, scope, bootstrapped, focused]);
  return { query, records, invalidate };
}
