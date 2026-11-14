import { create } from "zustand";

type SessionState = {
  isBootstrapped: boolean;
  bootstrapStatus: "pending" | "error" | "ready";
  bootstrapAttempt: number;
  membershipRevision: number;
  activeAccountId: string | null;
  activeCoupleId: string | null;
  activeAvatarUrl: string | null;
  sessionId: number;
  setBootstrap: (activeAccountId: string | null, activeCoupleId: string | null, expectedSessionId: number, activeAvatarUrl?: string | null) => void;
  setBootstrapError: (expectedSessionId: number) => void;
  retryBootstrap: () => void;
  syncActiveSession: (activeAccountId: string, activeCoupleId: string | null, activeAvatarUrl: string | null, expectedMembershipRevision: number) => void;
  setActiveAccount: (activeAccountId: string | null, activeCoupleId?: string | null, activeAvatarUrl?: string | null) => void;
  setActiveCouple: (activeCoupleId: string | null) => void;
  setActiveAvatar: (activeAvatarUrl: string | null) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isBootstrapped: false,
  bootstrapStatus: "pending",
  bootstrapAttempt: 0,
  membershipRevision: 0,
  activeAccountId: null,
  activeCoupleId: null,
  activeAvatarUrl: null,
  sessionId: 0,
  setBootstrap: (activeAccountId, activeCoupleId, expectedSessionId, activeAvatarUrl = null) => set((state) => (
    state.sessionId === expectedSessionId
      ? { activeAccountId, activeCoupleId, activeAvatarUrl, isBootstrapped: true, bootstrapStatus: "ready", sessionId: state.sessionId + 1, membershipRevision: state.membershipRevision + 1 }
      : state
  )),
  setBootstrapError: (expectedSessionId) => set((state) => state.sessionId === expectedSessionId && !state.isBootstrapped ? { bootstrapStatus: "error" } : state),
  retryBootstrap: () => set((state) => ({ bootstrapStatus: "pending", bootstrapAttempt: state.bootstrapAttempt + 1 })),
  syncActiveSession: (activeAccountId, activeCoupleId, activeAvatarUrl, expectedMembershipRevision) => set((state) => {
    const accountChanged = state.activeAccountId !== activeAccountId;
    const couple = accountChanged || state.membershipRevision === expectedMembershipRevision ? activeCoupleId : state.activeCoupleId;
    return {
      activeAccountId, activeCoupleId: couple, activeAvatarUrl, isBootstrapped: true, bootstrapStatus: "ready",
      sessionId: state.sessionId + (accountChanged ? 1 : 0),
      membershipRevision: state.membershipRevision + (accountChanged || couple !== state.activeCoupleId ? 1 : 0),
    };
  }),
  setActiveAccount: (activeAccountId, activeCoupleId = null, activeAvatarUrl = null) => set((state) => ({
    activeAccountId, activeCoupleId, activeAvatarUrl, isBootstrapped: true, bootstrapStatus: "ready",
    sessionId: state.sessionId + (state.activeAccountId !== activeAccountId ? 1 : 0),
    membershipRevision: state.membershipRevision + (state.activeAccountId !== activeAccountId || state.activeCoupleId !== activeCoupleId ? 1 : 0),
  })),
  setActiveCouple: (activeCoupleId) => set((state) => ({ activeCoupleId, membershipRevision: state.membershipRevision + 1 })),
  setActiveAvatar: (activeAvatarUrl) => set({ activeAvatarUrl }),
  reset: () => set((state) => ({ activeAccountId: null, activeCoupleId: null, activeAvatarUrl: null, isBootstrapped: true, bootstrapStatus: "ready", sessionId: state.sessionId + 1, membershipRevision: state.membershipRevision + 1 })),
}));
