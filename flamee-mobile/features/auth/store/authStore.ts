import { create } from 'zustand';

import {
  persistSession,
  readPersistedSession,
  removePersistedSession,
} from '@/features/auth/services/authSessionStorage';
import type { AuthSession } from '@/features/auth/types';

export type AuthStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

type AuthState = {
  session: AuthSession | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
};

let hydrationPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  status: 'hydrating',
  hydrate: () => {
    if (get().status !== 'hydrating') {
      return Promise.resolve();
    }

    if (!hydrationPromise) {
      hydrationPromise = readPersistedSession()
        .then((session) => {
          set({
            session,
            status: session ? 'authenticated' : 'unauthenticated',
          });
        })
        .catch(() => {
          set({ session: null, status: 'unauthenticated' });
        })
        .finally(() => {
          hydrationPromise = null;
        });
    }

    return hydrationPromise;
  },
  setSession: async (session) => {
    await persistSession(session);
    set({ session, status: 'authenticated' });
  },
  clearSession: async () => {
    await removePersistedSession();
    set({ session: null, status: 'unauthenticated' });
  },
}));
