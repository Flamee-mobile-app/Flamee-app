import type { MemoryScope } from "./memoryQueries.ts";

export function isMemoryMutationScopeCurrent(scope: MemoryScope, current: { activeAccountId: string | null; activeCoupleId: string | null; sessionId: number }) {
  return Boolean(scope.accountId && scope.coupleId) && scope.accountId === current.activeAccountId && scope.coupleId === current.activeCoupleId && scope.sessionId === current.sessionId;
}

/** Check again on each token retry and after acknowledgement, before publishing. */
export async function runScopedMemoryMutation<T>(isCurrent: () => boolean, operation: () => Promise<T>): Promise<T> {
  if (!isCurrent()) throw new Error("cancelled");
  const result = await operation();
  if (!isCurrent()) throw new Error("cancelled");
  return result;
}
