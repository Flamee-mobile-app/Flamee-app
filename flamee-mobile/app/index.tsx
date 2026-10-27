import { Redirect } from "expo-router";
import { useSessionStore } from "../src/shared/state/sessionStore";
import { AppScreen } from "../src/shared/components";
import { inviteIntent, useInviteIntentRevision } from "../src/features/invites";
import { resolveEntryRoute } from "../src/shared/navigation/entryRoute";
import { useStartup } from "../src/providers/StartupProvider";
import { SessionRecoveryScreen } from "../src/providers/SessionRecoveryScreen";

export default function IndexRoute() {
  const bootstrapped = useSessionStore((session) => session.isBootstrapped);
  const bootstrapStatus = useSessionStore((session) => session.bootstrapStatus);
  const accountId = useSessionStore((session) => session.activeAccountId);
  const coupleId = useSessionStore((session) => session.activeCoupleId);
  useInviteIntentRevision();
  const { canNavigate } = useStartup();
  const route = resolveEntryRoute({
    bootstrapped,
    accountId,
    setupStatus: null,
    inviteIntent: Boolean(inviteIntent.getCode()),
    coupleStatus: accountId ? (coupleId ? "paired" : "none") : null,
  });

  if (!bootstrapped) return <SessionRecoveryScreen pending={bootstrapStatus !== "error"} />;
  if (route && canNavigate) return <Redirect href={route} />;
  return <AppScreen scroll={false} padded={false} />;
}
