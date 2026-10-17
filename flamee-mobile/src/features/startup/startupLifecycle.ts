import { startupTokens } from "../../shared/constants/tokens.ts";

type StartupReadiness = {
  prepared: boolean;
  animationComplete: boolean;
  sessionReady: boolean;
  isEntryRoute: boolean;
  entryFailed: boolean;
  overlayVisible: boolean;
  contentRevealReady: boolean;
};

// Deliberately not persisted and never reset by sign-out, navigation or AppState.
export const startupLifetime = { animationCompleted: false, dismissed: false };

export function resolveStartupPrepared(state: { laidOut: boolean; assetsReady: boolean }): boolean {
  return state.laidOut && state.assetsReady;
}

export function resolveStartupLifecycleDelays(elapsed: number, reducedMotion: boolean): {
  animationComplete: number;
  revealReady: number;
  dismissed: number;
} {
  if (reducedMotion) return { animationComplete: 0, revealReady: 0, dismissed: 0 };
  const boundedElapsed = Math.max(0, Math.min(startupTokens.duration, elapsed));
  return {
    animationComplete: (startupTokens.duration - boundedElapsed)
      * startupTokens.playbackDuration / startupTokens.duration,
    revealReady: startupTokens.contentRevealDelay,
    dismissed: startupTokens.exitDuration,
  };
}

export function resolveStartupGate(state: StartupReadiness): { canNavigate: boolean; canDismiss: boolean; canReveal: boolean } {
  const canNavigate = state.prepared && state.sessionReady;
  return {
    canNavigate,
    canDismiss: canNavigate && state.animationComplete,
    canReveal: !state.overlayVisible || state.contentRevealReady,
  };
}
