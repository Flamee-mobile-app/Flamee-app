import { useEffect, type PropsWithChildren } from "react";
import { authService } from "../features/auth";
import { startupTokens } from "../shared/constants/tokens";
import { useSessionStore } from "../shared/state/sessionStore";
import { observeStartupSession } from "./startupSessionDeadline";

const sessionDeadline = Math.max(1_000, startupTokens.initializationTimeout - 1_000);

export function SessionInitializer({ children }: PropsWithChildren) {
  const attempt = useSessionStore((state) => state.bootstrapAttempt);
  useEffect(() => {
    const bootstrapSessionId = useSessionStore.getState().sessionId;
    return observeStartupSession(authService.getCurrentSession(), sessionDeadline, {
      onSuccess: (session) => {
        useSessionStore.getState().setBootstrap(
          session?.accountId ?? null,
          session?.user.couple_id ?? null,
          bootstrapSessionId,
          session?.user.avatar_url ?? null,
        );
      },
      onFailure: () => useSessionStore.getState().setBootstrapError(bootstrapSessionId),
      onDeadline: () => useSessionStore.getState().setBootstrapError(bootstrapSessionId),
    });
  }, [attempt]);

  return children;
}
