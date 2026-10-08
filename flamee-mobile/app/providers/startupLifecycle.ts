type StartupReadiness = {
  prepared: boolean;
  animationComplete: boolean;
  sessionReady: boolean;
  isEntryRoute: boolean;
  entryFailed: boolean;
};

// Deliberately not persisted and never reset by sign-out, navigation or AppState.
export const startupLifetime = { animationCompleted: false, dismissed: false };

export function resolveStartupGate(state: StartupReadiness): { canNavigate: boolean; canDismiss: boolean } {
  const canNavigate = state.prepared && state.animationComplete && state.sessionReady;
  return {
    canNavigate,
    canDismiss: canNavigate && (!state.isEntryRoute || state.entryFailed),
  };
}
