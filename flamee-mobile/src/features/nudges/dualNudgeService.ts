import { authService } from "../auth";
import { useSessionStore } from "../../shared/state/sessionStore";
import { createDualNudgeApi, DualNudgeError, type NudgeAction } from "./dualNudgeApi";
import type { QueryClient } from "@tanstack/react-query";

export type DualNudgeScope = { accountId: string | null; coupleId: string | null; sessionId: number; revision: number };
export const dualNudgeKey = (scope: DualNudgeScope) => ["dual-nudge", scope.sessionId, scope.accountId, scope.coupleId, scope.revision] as const;
export function pruneDualNudges(client: QueryClient, scope: DualNudgeScope) {
  const key = dualNudgeKey(scope);
  const filters = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === "dual-nudge" && (!scope.accountId || !scope.coupleId || key.some((value, index) => query.queryKey[index] !== value)) };
  void client.cancelQueries(filters); client.removeQueries(filters);
}
export function dualNudgeCurrent(scope: DualNudgeScope) {
  const state = useSessionStore.getState();
  return Boolean(scope.accountId && scope.coupleId) && scope.accountId === state.activeAccountId && scope.coupleId === state.activeCoupleId && scope.sessionId === state.sessionId && scope.revision === state.membershipRevision;
}
const api = createDualNudgeApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" });
async function scoped<T extends { receiver_id: string; couple_id: string } | null>(scope: DualNudgeScope, operation: (token: string) => Promise<T>): Promise<T> {
  const check = () => { if (!dualNudgeCurrent(scope)) { const error = new Error("cancelled"); error.name = "AbortError"; throw error; } };
  return authService.withAccessToken(async (token) => {
    check(); const result = await operation(token); check();
    if (result && (result.receiver_id !== scope.accountId || result.couple_id !== scope.coupleId)) throw new DualNudgeError("response");
    return result;
  });
}
export const dualNudgeService = {
  active: (scope: DualNudgeScope, signal?: AbortSignal) => scoped(scope, (token) => api.active(token, signal)),
  detail: (scope: DualNudgeScope, id: string, signal?: AbortSignal) => scoped(scope, (token) => api.detail(token, id, signal)),
  act: (scope: DualNudgeScope, id: string, action: NudgeAction, version: number) => scoped(scope, (token) => api.act(token, id, action, version)),
};
