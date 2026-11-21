import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { connectionOptions, inviteService } from "../features/invites";
import { useSessionStore } from "../shared/state/sessionStore";
import { prefetchRemoteImage } from "../shared/media/imagePrefetch";

/** Load the signed member profiles before Mood is visited, using its exact query key. */
export function ConnectionWarmup() {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const bootstrapped = useSessionStore((state) => state.isBootstrapped);
  const avatar = useSessionStore((state) => state.activeAvatarUrl);
  const client = useQueryClient();
  const enabled = bootstrapped && Boolean(accountId && coupleId);
  const query = useQuery({ ...connectionOptions({ accountId, coupleId, sessionId }, inviteService.connection), enabled });
  const scopeKey = JSON.stringify([sessionId, accountId, coupleId]);
  const warmed = useRef({ scopeKey, urls: new Set<string>() });
  if (warmed.current.scopeKey !== scopeKey) warmed.current = { scopeKey, urls: new Set() };
  useEffect(() => {
    if (!bootstrapped || !accountId) return;
    const pair = enabled && !query.isError && query.data?.id === coupleId ? query.data : null;
    const urls = [avatar, pair?.partner1.avatar_url, pair?.partner2.avatar_url];
    for (const uri of new Set(urls)) {
      if (!uri || warmed.current.urls.has(uri)) continue;
      warmed.current.urls.add(uri);
      while (warmed.current.urls.size > 8) warmed.current.urls.delete(warmed.current.urls.values().next().value!);
      void prefetchRemoteImage(uri).catch(() => false);
    }
  }, [scopeKey, bootstrapped, enabled, accountId, coupleId, avatar, query.data, query.isError]);
  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener("change", (state) => {
      const current = useSessionStore.getState();
      if (state === "active" && current.sessionId === sessionId && current.activeAccountId === accountId && current.activeCoupleId === coupleId) {
        void client.fetchQuery(connectionOptions({ accountId, coupleId, sessionId }, inviteService.connection)).catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [enabled, client, accountId, coupleId, sessionId]);
  return null;
}
