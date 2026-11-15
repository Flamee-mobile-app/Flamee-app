import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "expo-router";
import { useSessionStore } from "../../shared/state/sessionStore";

export function useConversationContext() {
  const accountId = useSessionStore((s) => s.activeAccountId);
  const coupleId = useSessionStore((s) => s.activeCoupleId);
  const sessionId = useSessionStore((s) => s.sessionId);
  const revision = useSessionStore((s) => s.membershipRevision);
  const bootstrapped = useSessionStore((s) => s.isBootstrapped);
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => setForeground(next === "active"));
    return () => subscription.remove();
  }, []);
  const scope = useMemo(() => ({ accountId, coupleId, sessionId, revision }), [accountId, coupleId, sessionId, revision]);
  return { scope, ready: bootstrapped && !!accountId && !!coupleId, active: focused && foreground, key: `${sessionId}:${accountId}:${coupleId}:${revision}` };
}
