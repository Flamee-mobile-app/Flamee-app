import { queryOptions, replaceEqualDeep, type QueryClient } from "@tanstack/react-query";
import { retainSignedAvatarUrl } from "../../shared/components/profileAvatarModel.ts";
import type { AcceptedCouple, ConnectionMember } from "./inviteApi.ts";

export type ConnectionScope = { accountId: string | null; coupleId: string | null; sessionId: number };
export const connectionKey = (scope: ConnectionScope) => ["connection", scope.sessionId, scope.accountId, scope.coupleId] as const;
export function connectionOptions(scope: ConnectionScope, read: () => Promise<AcceptedCouple>, retainUrls = () => true) {
  const retain = (old: ConnectionMember | undefined, next: ConnectionMember) => old?.id === next.id ? { ...next, avatar_url: retainSignedAvatarUrl(old.avatar_url, next.avatar_url) } : next;
  return queryOptions({ queryKey: connectionKey(scope), queryFn: read, staleTime: 60_000, retry: false,
    structuralSharing: (previous, current) => {
      const old = previous as AcceptedCouple | undefined;
      const next = current as AcceptedCouple;
      return replaceEqualDeep(old, retainUrls() && old?.id === next.id ? { ...next, partner1: retain(old.partner1, next.partner1), partner2: retain(old.partner2, next.partner2) } : next);
    },
  });
}
export function pruneConnectionQueries(client: QueryClient, scope: ConnectionScope) {
  const current = connectionKey(scope);
  const filters = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === "connection" && (!scope.accountId || !scope.coupleId || current.some((value, index) => query.queryKey[index] !== value)) };
  void client.cancelQueries(filters);
  client.removeQueries(filters);
}
