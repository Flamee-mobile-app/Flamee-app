import { useEffect, type PropsWithChildren } from "react";
import { localAuthService } from "../features/auth";
import { useSessionStore } from "../shared/state/sessionStore";

export function SessionInitializer({ children }: PropsWithChildren) {
  useEffect(() => {
    let active = true;
    void localAuthService
      .getCurrentSession()
      .then((session) => {
        if (active) useSessionStore.getState().setBootstrap(session?.accountId ?? null);
      })
      .catch(() => {
        if (active) useSessionStore.getState().reset();
      });
    return () => {
      active = false;
    };
  }, []);

  return children;
}
