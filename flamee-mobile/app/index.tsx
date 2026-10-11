import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useSessionStore } from "../src/shared/state/sessionStore";
import { FoundationScreen } from "../src/shared/components/FoundationScreen";
import { AppScreen } from "../src/shared/components";
import { localCoupleService } from "../src/features/couple";
import { localOnboardingService } from "../src/features/onboarding";
import { inviteIntent, useInviteIntentRevision } from "../src/features/invites";
import { resolveEntryRoute, type EntryRouteHref } from "../src/shared/navigation/entryRoute";
import { useStartup } from "../src/providers/StartupProvider";

export default function IndexRoute() {
  const bootstrapped = useSessionStore((session) => session.isBootstrapped);
  const accountId = useSessionStore((session) => session.activeAccountId);
  const inviteRevision = useInviteIntentRevision();
  const [route, setRoute] = useState<EntryRouteHref | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { canNavigate, reportEntryFailure } = useStartup();

  useEffect(() => {
    reportEntryFailure(failed);
  }, [failed, reportEntryFailure]);

  useEffect(() => {
    let active = true;
    setRoute(null);
    setFailed(false);
    if (!bootstrapped) return () => { active = false; };
    if (!accountId) {
      setRoute(resolveEntryRoute({ bootstrapped: true, accountId: null, setupStatus: null, inviteIntent: Boolean(inviteIntent.getCode()), coupleStatus: null }));
      return () => { active = false; };
    }
    void Promise.all([
      localOnboardingService.getAccountSnapshot(accountId),
      localCoupleService.getMembership(accountId),
    ]).then(([account, membership]) => {
      if (!active) return;
      setRoute(resolveEntryRoute({
        bootstrapped: true,
        accountId,
        setupStatus: account.setupStatus,
        inviteIntent: Boolean(inviteIntent.getCode()),
        coupleStatus: membership.status,
      }));
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [bootstrapped, accountId, attempt, inviteRevision]);

  if (route && canNavigate) return <Redirect href={route} />;
  if (failed) {
    return <AppScreen scroll={false} padded={false}><FoundationScreen title="errorTitle" description="errorDescription" actionLabel="retry" onAction={() => setAttempt((value) => value + 1)} /></AppScreen>;
  }
  return <AppScreen scroll={false} padded={false}><FoundationScreen title="loadingTitle" description="loadingDescription" /></AppScreen>;
}
