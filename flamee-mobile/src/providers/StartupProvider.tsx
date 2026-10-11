import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useSegments } from "expo-router";
import * as NativeSplash from "expo-splash-screen";
import { YStack } from "tamagui";
import { resolveStartupGate, startupLifetime, StartupSplash } from "../features/startup";
import { startupTokens } from "../shared/constants/tokens";
import { useSessionStore } from "../shared/state/sessionStore";
import { ScreenRevealContext } from "../shared/motion/ScreenReveal";

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
  const isEntryRoute = segments.at(0) === undefined;
  const bootstrapped = useSessionStore((session) => session.isBootstrapped);
  const [visible, setVisible] = useState(!startupLifetime.dismissed);
  const [prepared, setPrepared] = useState(startupLifetime.dismissed);
  const [complete, setComplete] = useState(startupLifetime.animationCompleted);
  const [entryFailed, setEntryFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Keep the overlay until the entry Redirect has mounted its destination.
  const { canNavigate, canDismiss: dismiss } = resolveStartupGate({ prepared, animationComplete: complete, sessionReady: bootstrapped, isEntryRoute, entryFailed });

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

  useEffect(() => {
    if (!visible || dismiss) return;
    // A stalled startup/session read must expose the existing root retry UI.
    const timeout = setTimeout(() => setTimedOut(true), startupTokens.initializationTimeout);
    return () => clearTimeout(timeout);
  }, [visible, dismiss]);

  const value = useMemo(() => ({ canNavigate, reportEntryFailure: setEntryFailed }), [canNavigate]);

  if (timedOut) throw new Error("Startup initialization timed out.");

  return (
    <StartupContext.Provider value={value}>
      <ScreenRevealContext.Provider value={!visible || dismiss}>
        <YStack flex={1}>
          <YStack flex={1} pointerEvents={visible ? "none" : "auto"} aria-hidden={visible}>
            {children}
          </YStack>
          {visible && <StartupSplash animationAlreadyComplete={startupLifetime.animationCompleted} dismiss={dismiss} onPrepared={onPrepared} onAnimationComplete={onAnimationComplete} onDismissed={onDismissed} />}
        </YStack>
      </ScreenRevealContext.Provider>
    </StartupContext.Provider>
  );
}
