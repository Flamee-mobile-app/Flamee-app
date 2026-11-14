export function isInviteScopeCurrent(scope: { accountId: string | null; sessionId: number }, state: { activeAccountId: string | null; sessionId: number }) {
  return Boolean(scope.accountId) && scope.accountId === state.activeAccountId && scope.sessionId === state.sessionId;
}
