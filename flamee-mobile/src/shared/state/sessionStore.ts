import { create } from "zustand";

type SessionState = {
  isBootstrapped: boolean;
  activeAccountId: string | null;
  activeCoupleId: string | null;
  sessionId: number;
  setBootstrap: (activeAccountId: string | null, activeCoupleId: string | null, expectedSessionId: number) => void;
  setActiveAccount: (activeAccountId: string | null, activeCoupleId?: string | null) => void;
  setActiveCouple: (activeCoupleId: string | null) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isBootstrapped: false,
  activeAccountId: null,
  activeCoupleId: null,
  sessionId: 0,
  setBootstrap: (activeAccountId, activeCoupleId, expectedSessionId) => set((state) => (
    state.sessionId === expectedSessionId
      ? { activeAccountId, activeCoupleId, isBootstrapped: true, sessionId: state.sessionId + 1 }
      : state
  )),
  setActiveAccount: (activeAccountId, activeCoupleId = null) => set((state) => ({ activeAccountId, activeCoupleId, isBootstrapped: true, sessionId: state.sessionId + 1 })),
  setActiveCouple: (activeCoupleId) => set({ activeCoupleId }),
  reset: () => set((state) => ({ activeAccountId: null, activeCoupleId: null, isBootstrapped: true, sessionId: state.sessionId + 1 })),
}));
