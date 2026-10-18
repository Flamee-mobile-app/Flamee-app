import { create } from "zustand";

type SessionState = {
  isBootstrapped: boolean;
  activeAccountId: string | null;
  activeCoupleId: string | null;
  activeAvatarUrl: string | null;
  sessionId: number;
  setBootstrap: (activeAccountId: string | null, activeCoupleId: string | null, expectedSessionId: number, activeAvatarUrl?: string | null) => void;
  setActiveAccount: (activeAccountId: string | null, activeCoupleId?: string | null, activeAvatarUrl?: string | null) => void;
  setActiveCouple: (activeCoupleId: string | null) => void;
  setActiveAvatar: (activeAvatarUrl: string | null) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isBootstrapped: false,
  activeAccountId: null,
  activeCoupleId: null,
  activeAvatarUrl: null,
  sessionId: 0,
  setBootstrap: (activeAccountId, activeCoupleId, expectedSessionId, activeAvatarUrl = null) => set((state) => (
    state.sessionId === expectedSessionId
      ? { activeAccountId, activeCoupleId, activeAvatarUrl, isBootstrapped: true, sessionId: state.sessionId + 1 }
      : state
  )),
  setActiveAccount: (activeAccountId, activeCoupleId = null, activeAvatarUrl = null) => set((state) => ({ activeAccountId, activeCoupleId, activeAvatarUrl, isBootstrapped: true, sessionId: state.sessionId + 1 })),
  setActiveCouple: (activeCoupleId) => set({ activeCoupleId }),
  setActiveAvatar: (activeAvatarUrl) => set({ activeAvatarUrl }),
  reset: () => set((state) => ({ activeAccountId: null, activeCoupleId: null, activeAvatarUrl: null, isBootstrapped: true, sessionId: state.sessionId + 1 })),
}));
