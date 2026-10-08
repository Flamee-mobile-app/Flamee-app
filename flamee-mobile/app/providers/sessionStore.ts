import { create } from "zustand";

type SessionState = {
  isBootstrapped: boolean;
  activeAccountId: string | null;
  activeCoupleId: string | null;
  setBootstrap: (activeAccountId: string | null) => void;
  setActiveAccount: (activeAccountId: string | null) => void;
  setActiveCouple: (activeCoupleId: string | null) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isBootstrapped: false,
  activeAccountId: null,
  activeCoupleId: null,
  setBootstrap: (activeAccountId) => set({ activeAccountId, isBootstrapped: true }),
  setActiveAccount: (activeAccountId) => set({ activeAccountId, activeCoupleId: null, isBootstrapped: true }),
  setActiveCouple: (activeCoupleId) => set({ activeCoupleId }),
  reset: () => set({ activeAccountId: null, activeCoupleId: null, isBootstrapped: true }),
}));
