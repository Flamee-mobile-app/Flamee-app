import type { AuthService } from "../auth/authService.ts";

export async function readInviteEntrySession(
  accountId: string,
  auth: Pick<AuthService, "getSessionSnapshot" | "getCurrentSession">,
  membership: () => { activeAccountId: string | null; activeCoupleId: string | null },
): Promise<{ accountId: string; coupleId: string | null } | null> {
  const session = auth.getSessionSnapshot() ?? await auth.getCurrentSession();
  const current = membership();
  if (!session || session.accountId !== accountId || current.activeAccountId !== accountId) return null;
  // Cached identity verifies the account; confirmed membership may have changed
  // through invite accept while that identity snapshot was still being refreshed.
  return { accountId, coupleId: current.activeCoupleId };
}
