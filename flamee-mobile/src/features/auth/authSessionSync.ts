import { useSessionStore } from "../../shared/state/sessionStore.ts";
import type { AuthSession, AuthSessionChangeReason } from "./authService.ts";

export function synchronizeAuthSession(session: AuthSession | null, expectedMembershipRevision: number, reason: AuthSessionChangeReason = "session"): void {
  const state = useSessionStore.getState();
  if (!session && reason === "signOut") state.reset();
  else if (!session) state.setActiveAvatar(null);
  else state.syncActiveSession(session.accountId, session.user.couple_id ?? null, session.user.avatar_url ?? null, expectedMembershipRevision);
}
