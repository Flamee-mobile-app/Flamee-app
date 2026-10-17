import { useEffect, type PropsWithChildren } from "react";
import { authService } from "../features/auth";
import { localOnboardingService } from "../features/onboarding";
import { useSessionStore } from "../shared/state/sessionStore";

export function SessionInitializer({ children }: PropsWithChildren) {
  useEffect(() => {
    let active = true;
    const bootstrapSessionId = useSessionStore.getState().sessionId;
    void authService
      .getCurrentSession()
      .then(async (session) => {
        if (active && session) {
          await localOnboardingService.initializeAuthenticatedAccount(session.accountId, {
            displayName: session.user.full_name,
            avatarUri: session.user.avatar_url ?? null,
          });
        }
        if (active) {
          useSessionStore.getState().setBootstrap(
            session?.accountId ?? null,
            session?.user.couple_id ?? null,
            bootstrapSessionId,
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
