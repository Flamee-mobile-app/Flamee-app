import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { Text } from "tamagui";
import { AppButton, AppScreen, AsyncStateView } from "../shared/components";
import { getMessage } from "../shared/localization/messages";
import { useSessionStore } from "../shared/state/sessionStore";
import { inviteIntent, useInviteIntentRevision } from "../features/invites";
import { onboardingService } from "../features/onboarding/services";
import { resolveEntryRoute, type EntryRouteSnapshot } from "../shared/navigation/entryRoute";
import { useStartup } from "./StartupProvider";
import { SessionRecoveryScreen } from "./SessionRecoveryScreen";

export function EntryRouteScreen() {
  const bootstrapped = useSessionStore((state) => state.isBootstrapped);
  const bootstrapStatus = useSessionStore((state) => state.bootstrapStatus);
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  useInviteIntentRevision();
  const invite = Boolean(inviteIntent.getCode());
  const { canNavigate, reportEntryFailure } = useStartup();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ sessionId: number; setup: EntryRouteSnapshot["setupStatus"]; failed: boolean } | null>(null);
  useEffect(() => {
    if (!bootstrapped || !accountId || coupleId || invite) return;
    const controller = new AbortController();
    setResult(null);
    void onboardingService.read(controller.signal).then((status) => {
      if (!controller.signal.aborted && useSessionStore.getState().sessionId === sessionId) setResult({ sessionId, setup: status === "skipped" ? "deferred" : status, failed: false });
    }, () => {
      if (!controller.signal.aborted && useSessionStore.getState().sessionId === sessionId) setResult({ sessionId, setup: null, failed: true });
    });
    return () => controller.abort();
  }, [bootstrapped, accountId, coupleId, sessionId, invite, attempt]);
  useEffect(() => {
    reportEntryFailure(result?.sessionId === sessionId && result.failed);
    return () => reportEntryFailure(false);
  }, [result, sessionId, reportEntryFailure]);
  if (!bootstrapped) return <SessionRecoveryScreen pending={bootstrapStatus !== "error"} />;
  const route = resolveEntryRoute({ bootstrapped, accountId, setupStatus: result?.sessionId === sessionId ? result.setup : null, inviteIntent: invite, coupleStatus: accountId ? coupleId ? "paired" : "none" : null });
  if (route && canNavigate) return <Redirect href={route} />;
  if (result?.sessionId === sessionId && result.failed && canNavigate) return <AppScreen>
    <AsyncStateView variant="error" description="onboardingReadError" actionLabel="retry" onAction={() => setAttempt((value) => value + 1)} />
    <AppButton variant="secondary" onPress={() => setResult({ sessionId, setup: "deferred", failed: false })}>{getMessage("vi", "onboardingContinueTemporary")}</AppButton>
  </AppScreen>;
  return <AppScreen scroll={false}><Text role="status" fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "loadingTitle")}</Text></AppScreen>;
}
