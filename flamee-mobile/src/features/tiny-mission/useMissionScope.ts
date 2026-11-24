import { useSessionStore } from "../../shared/state/sessionStore";
import type { MissionScope } from "./missionServiceCore";

export function useMissionScope(): MissionScope {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const revision = useSessionStore((state) => state.membershipRevision);
  return { accountId, coupleId, sessionId, revision };
}
