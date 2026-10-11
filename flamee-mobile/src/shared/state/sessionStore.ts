import { create } from "zustand";

type SessionState = {
  isBootstrapped: boolean;
  activeAccountId: string | null;
  activeCoupleId: string | null;
  sessionId: number;
  setBootstrap: (activeAccountId: string | null) => void;
  setActiveAccount: (activeAccountId: string | null) => void;
  setActiveCouple: (activeCoupleId: string | null) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isBootstrapped: false,
  activeAccountId: null,
  activeCoupleId: null,
  sessionId: 0,
  setBootstrap: (activeAccountId) => set((state) => ({ activeAccountId, activeCoupleId: null, isBootstrapped: true, sessionId: state.sessionId + 1 })),
  setActiveAccount: (activeAccountId) => set((state) => ({ activeAccountId, activeCoupleId: null, isBootstrapped: true, sessionId: state.sessionId + 1 })),
  setActiveCouple: (activeCoupleId) => set({ activeCoupleId }),
  reset: () => set((state) => ({ activeAccountId: null, activeCoupleId: null, isBootstrapped: true, sessionId: state.sessionId + 1 })),
}));
