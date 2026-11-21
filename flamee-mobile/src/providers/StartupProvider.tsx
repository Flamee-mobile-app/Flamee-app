import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useSegments } from "expo-router";
import * as NativeSplash from "expo-splash-screen";
import { YStack } from "tamagui";
import { resolveStartupGate, resolveStartupPresentation, startupLifetime, StartupSplash } from "../features/startup";
import { startupTokens } from "../shared/constants/tokens";
import { useSessionStore } from "../shared/state/sessionStore";
import { ScreenRevealContext } from "../shared/motion/ScreenReveal";
import { startupPreferences } from "../shared/native/startupPreferences";

// Temporary visual review mode. Turn off after approval to restore once-per-install behavior.
const PREVIEW_STARTUP_SPLASH = true;

// Keep the native surface over the first React render. The custom splash will
// release it only after its layout and image assets are ready, or the session
// and persisted preference determine that the introduction should be skipped.
void NativeSplash.preventAutoHideAsync().catch(() => undefined);

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
  const bootstrapStatus = useSessionStore((session) => session.bootstrapStatus);
  const accountId = useSessionStore((session) => session.activeAccountId);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [laidOut, setLaidOut] = useState(false);
  const [presentation, setPresentation] = useState<"pending" | "play" | "skip">(startupLifetime.dismissed ? "skip" : PREVIEW_STARTUP_SPLASH ? "play" : "pending");
  const [visible, setVisible] = useState(!startupLifetime.dismissed);
  const [prepared, setPrepared] = useState(startupLifetime.dismissed);
  const [complete, setComplete] = useState(startupLifetime.animationCompleted);
  const [revealReady, setRevealReady] = useState(startupLifetime.dismissed);
  const [entryFailed, setEntryFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Keep the overlay until the entry Redirect has mounted its destination.
  const { canNavigate, canDismiss: dismiss, canReveal } = resolveStartupGate({
    prepared,
    animationComplete: complete,
    sessionReady: bootstrapped || bootstrapStatus === "error",
    isEntryRoute,
    entryFailed: entryFailed || bootstrapStatus === "error",
    overlayVisible: visible,
    contentRevealReady: revealReady,
  });

  const onPrepared = useCallback(async () => {
    await NativeSplash.hideAsync().catch(() => undefined);
    setPrepared(true);
  }, []);
  const onAnimationComplete = useCallback(() => {
    startupLifetime.animationCompleted = true;
    setComplete(true);
  }, []);
  const onRevealReady = useCallback(() => setRevealReady(true), []);
  const onDismissed = useCallback(() => {
    startupLifetime.dismissed = true;
    setVisible(false);
    if (!PREVIEW_STARTUP_SPLASH) void startupPreferences.markSeen().catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    void startupPreferences.hasSeen().then((value) => {
      if (active) setSeen(value);
    }, () => { if (active) setSeen(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (presentation !== "pending") return;
    setPresentation(resolveStartupPresentation({
      sessionReady: bootstrapped || bootstrapStatus === "error",
      hasSession: bootstrapped && accountId !== null,
      seen,
    }));
  }, [presentation, bootstrapped, bootstrapStatus, accountId, seen]);

  useEffect(() => {
    if (presentation !== "skip" || !laidOut) return;
    let active = true;
    void NativeSplash.hideAsync().catch(() => undefined).then(() => {
      if (!active) return;
      startupLifetime.animationCompleted = true;
      setPrepared(true);
      setComplete(true);
      setRevealReady(true);
      onDismissed();
    });
    return () => { active = false; };
  }, [presentation, laidOut, onDismissed]);

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
      <ScreenRevealContext.Provider value={canReveal}>
        <YStack flex={1} onLayout={() => setLaidOut(true)}>
          <YStack flex={1} pointerEvents={visible ? "none" : "auto"} aria-hidden={visible}>
            {children}
          </YStack>
          {visible && presentation === "play" && <StartupSplash sessionReady={bootstrapped} destinationReady={!isEntryRoute} animationAlreadyComplete={startupLifetime.animationCompleted} dismiss={dismiss} onPrepared={onPrepared} onAnimationComplete={onAnimationComplete} onRevealReady={onRevealReady} onDismissed={onDismissed} />}
        </YStack>
      </ScreenRevealContext.Provider>
    </StartupContext.Provider>
  );
}
