import { authService } from "../auth";
import { useSessionStore } from "../../shared/state/sessionStore";
import { createMissionApi } from "./missionApi";
import { createMissionService, type MissionScope } from "./missionServiceCore";

export function missionScopeCurrent(scope: MissionScope) {
  const state = useSessionStore.getState();
  return Boolean(scope.accountId && scope.coupleId) && state.activeAccountId === scope.accountId && state.activeCoupleId === scope.coupleId && state.sessionId === scope.sessionId && state.membershipRevision === scope.revision;
}
export const missionService = createMissionService(createMissionApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" }), authService, missionScopeCurrent);
