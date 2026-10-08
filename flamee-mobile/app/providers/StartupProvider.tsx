import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useSegments } from "expo-router";
import * as NativeSplash from "expo-splash-screen";
import { YStack } from "tamagui";
import { StartupSplash } from "../../src/features/startup";
import { startupTokens } from "../../src/shared/constants/tokens";
import { useSessionStore } from "./sessionStore";
import { resolveStartupGate, startupLifetime } from "./startupLifecycle";

export function revealStartupError(): void {
  startupLifetime.animationCompleted = true;
  // Retrying a failed cold start shows the completed artwork and keeps the
  // initialization deadline, without replaying the entrance animation.
  void NativeSplash.hideAsync().catch(() => undefined);
}

type StartupContextValue = {
  canNavigate: boolean;
  reportEntryFailure: (failed: boolean) => void;
};

const StartupContext = createContext<StartupContextValue | null>(null);

export function useStartup(): StartupContextValue {
  const context = useContext(StartupContext);
  if (!context) throw new Error("StartupProvider is required.");
  return context;
}

export function StartupProvider({ children }: PropsWithChildren) {
  const segments = useSegments();
  const startedAtEntryRoute = useRef(segments.at(0) === undefined).current;
  const bootstrapped = useSessionStore((session) => session.isBootstrapped);
  const [visible, setVisible] = useState(!startupLifetime.dismissed);
  const [prepared, setPrepared] = useState(startupLifetime.dismissed);
  const [complete, setComplete] = useState(startupLifetime.animationCompleted);
  const [continueRequested, setContinueRequested] = useState(false);
  const [entryFailed, setEntryFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Preserve root-entry intent after its Redirect changes the route segments.
  // Deep links still dismiss automatically without an extra tap.
  const { canNavigate, canDismiss: autoDismiss } = resolveStartupGate({ prepared, animationComplete: complete, sessionReady: bootstrapped, isEntryRoute: startedAtEntryRoute, entryFailed });
  const showContinue = startedAtEntryRoute && !entryFailed;
  const canContinue = canNavigate && startedAtEntryRoute && !entryFailed;
  const dismiss = autoDismiss || (canContinue && continueRequested);

  const onPrepared = useCallback(() => {
    setPrepared(true);
    void NativeSplash.hideAsync().catch(() => undefined);
  }, []);
  const onAnimationComplete = useCallback(() => {
    startupLifetime.animationCompleted = true;
    setComplete(true);
  }, []);
  const onDismissed = useCallback(() => {
    startupLifetime.dismissed = true;
    setVisible(false);
  }, []);
  const onContinue = useCallback(() => {
    if (canContinue) setContinueRequested(true);
  }, [canContinue]);

  useEffect(() => {
    if (!visible || canNavigate) return;
    // A stalled startup/session read must expose the existing root retry UI.
    const timeout = setTimeout(() => setTimedOut(true), startupTokens.initializationTimeout);
    return () => clearTimeout(timeout);
  }, [visible, canNavigate]);

  const value = useMemo(() => ({ canNavigate, reportEntryFailure: setEntryFailed }), [canNavigate]);

  if (timedOut) throw new Error("Startup initialization timed out.");

  return (
    <StartupContext.Provider value={value}>
      <YStack flex={1}>
        <YStack flex={1} pointerEvents={visible ? "none" : "auto"} accessibilityElementsHidden={visible} importantForAccessibility={visible ? "no-hide-descendants" : "auto"}>
          {children}
        </YStack>
        {visible && <StartupSplash animationAlreadyComplete={startupLifetime.animationCompleted} dismiss={dismiss} showContinue={showContinue} canContinue={canContinue} onContinue={onContinue} onPrepared={onPrepared} onAnimationComplete={onAnimationComplete} onDismissed={onDismissed} />}
      </YStack>
    </StartupContext.Provider>
  );
}
