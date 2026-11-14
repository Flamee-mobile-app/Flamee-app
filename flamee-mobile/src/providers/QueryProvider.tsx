import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { useSessionStore } from "../shared/state/sessionStore";
import { pruneMemoryQueries } from "../features/moments";
import { pruneMoodHistory } from "../features/checkins";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const prune = () => {
      const state = useSessionStore.getState();
      pruneMemoryQueries(queryClient, { accountId: state.activeAccountId, coupleId: state.activeCoupleId, sessionId: state.sessionId });
      pruneMoodHistory(queryClient, { accountId: state.activeAccountId, sessionId: state.sessionId, coupleId: state.activeCoupleId });
    };
    prune();
    return useSessionStore.subscribe((state, previous) => {
      if (state.activeAccountId !== previous.activeAccountId || state.activeCoupleId !== previous.activeCoupleId || state.sessionId !== previous.sessionId) prune();
    });
  }, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
