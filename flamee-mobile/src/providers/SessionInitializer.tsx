import { useEffect, type PropsWithChildren } from "react";
import { authService } from "../features/auth";
import { startupTokens } from "../shared/constants/tokens";
import { useSessionStore } from "../shared/state/sessionStore";
import { settleBeforeStartupDeadline } from "./startupSessionDeadline";

const sessionDeadline = Math.max(1_000, startupTokens.initializationTimeout - 1_000);

export function SessionInitializer({ children }: PropsWithChildren) {
  useEffect(() => {
    let active = true;
    const bootstrapSessionId = useSessionStore.getState().sessionId;
    void settleBeforeStartupDeadline(authService.getCurrentSession(), sessionDeadline)
      .then((session) => {
        if (active) {
          useSessionStore.getState().setBootstrap(
            session?.accountId ?? null,
            session?.user.couple_id ?? null,
            bootstrapSessionId,
            session?.user.avatar_url ?? null,
          );
        }
      })
      .catch(() => {
        if (active) useSessionStore.getState().setBootstrap(null, null, bootstrapSessionId);
      });
    return () => {
      active = false;
    };
  }, []);

  return children;
}
