import { MissionApiError, type createMissionApi, type MissionAssignment, type MissionReward } from "./missionApi.ts";
import type { QueryClient } from "@tanstack/react-query";

export type MissionScope = { accountId: string | null; coupleId: string | null; sessionId: number; revision: number };
export const missionKey = (scope: MissionScope) => ["tiny-mission", scope.sessionId, scope.accountId, scope.coupleId, scope.revision] as const;
export function pruneMissionQueries(client: QueryClient, scope: MissionScope) {
  const current = missionKey(scope);
  const filters = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === "tiny-mission" && (!scope.accountId || !scope.coupleId || current.some((value, index) => query.queryKey[index] !== value)) };
  void client.cancelQueries(filters); client.removeQueries(filters);
}
export function createMissionService(api: ReturnType<typeof createMissionApi>, auth: { withAccessToken: <T>(read: (token: string) => Promise<T>) => Promise<T> }, current: (scope: MissionScope) => boolean) {
  async function scoped<T>(scope: MissionScope, read: (token: string) => Promise<T>, validate: (result: T) => boolean = () => true) {
    const check = () => { if (!scope.accountId || !scope.coupleId || !current(scope)) { const error = new Error("cancelled"); error.name = "AbortError"; throw error; } };
    return auth.withAccessToken(async (token) => { check(); const result = await read(token); check(); if (!validate(result)) throw new MissionApiError("response"); return result; });
  }
  return {
    today: (scope: MissionScope, signal?: AbortSignal) => scoped(scope, (token) => api.today(token, signal), (page) => page.assignments.every((row) => row.couple_id === scope.coupleId)),
    wallet: (scope: MissionScope, signal?: AbortSignal) => scoped(scope, (token) => api.wallet(token, signal), (row) => row.couple_id === scope.coupleId),
    achievements: (scope: MissionScope, signal?: AbortSignal) => scoped(scope, (token) => api.achievements(token, signal), (rows) => rows.every((row) => row.couple_id === scope.coupleId)),
    ledger: (scope: MissionScope, offset: number, signal?: AbortSignal) => scoped(scope, (token) => api.ledger(token, offset, signal), (rows) => rows.every((row) => row.couple_id === scope.coupleId)),
    rewards: (scope: MissionScope, offset: number, signal?: AbortSignal) => scoped(scope, (token) => api.rewards(token, offset, signal)),
    redemptions: (scope: MissionScope, offset: number, signal?: AbortSignal) => scoped(scope, (token) => api.redemptions(token, offset, signal), (rows) => rows.every((row) => row.couple_id === scope.coupleId || row.actor_id === scope.accountId)),
    redemption: (scope: MissionScope, id: string, signal?: AbortSignal) => scoped(scope, (token) => api.redemption(token, id, signal), (row) => row.couple_id === scope.coupleId || row.actor_id === scope.accountId),
    change: (scope: MissionScope, row: MissionAssignment, action: "complete" | "swap", key: string) => {
      if (row.couple_id !== scope.coupleId || (row.assignee_id && row.assignee_id !== scope.accountId)) return Promise.reject(new MissionApiError("forbidden"));
      return scoped(scope, (token) => api.change(token, row, action, scope.accountId!, key), (result) => result.couple_id === scope.coupleId);
    },
    redeem: (scope: MissionScope, reward: MissionReward, key: string) => scoped(scope, (token) => api.redeem(token, reward, key), (row) => row.couple_id === scope.coupleId && row.actor_id === scope.accountId),
  };
}
