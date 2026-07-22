import type { AuthSession } from '@/features/auth/types';
import {
  persistSession,
  readPersistedSession,
  removePersistedSession,
} from '@/features/auth/services/authSessionStorage';

import { useAuthStore } from './authStore';

jest.mock('@/features/auth/services/authSessionStorage', () => ({
  persistSession: jest.fn(),
  readPersistedSession: jest.fn(),
  removePersistedSession: jest.fn(),
}));

type AuthStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

type AuthStoreContract = {
  session: AuthSession | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
};

const session: AuthSession = {
  userId: 'demo-user',
  displayName: 'An & Bình',
  email: 'an@example.com',
};

const mockedReadPersistedSession = readPersistedSession as jest.MockedFunction<
  typeof readPersistedSession
>;
const mockedPersistSession = persistSession as jest.MockedFunction<typeof persistSession>;
const mockedRemovePersistedSession = removePersistedSession as jest.MockedFunction<
  typeof removePersistedSession
>;

function authState() {
  return useAuthStore.getState() as unknown as AuthStoreContract;
}

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ session: null, status: 'hydrating' } as Partial<AuthStoreContract>);
  });

  it('hydrates a stored session once and exposes authenticated state', async () => {
    mockedReadPersistedSession.mockResolvedValue(session);

    await Promise.all([authState().hydrate(), authState().hydrate()]);

    expect(mockedReadPersistedSession).toHaveBeenCalledTimes(1);
    expect(authState()).toMatchObject({ session, status: 'authenticated' });
  });

  it('becomes unauthenticated when no session can be restored', async () => {
    mockedReadPersistedSession.mockResolvedValue(null);

    await authState().hydrate();

    expect(authState()).toMatchObject({ session: null, status: 'unauthenticated' });
  });

  it('persists before exposing an authenticated session', async () => {
    let stateWhileWriting: AuthSession | null | undefined;
    mockedPersistSession.mockImplementation(async () => {
      stateWhileWriting = authState().session;
    });

    await authState().setSession(session);

    expect(mockedPersistSession).toHaveBeenCalledWith(session);
    expect(stateWhileWriting).toBeNull();
    expect(authState()).toMatchObject({ session, status: 'authenticated' });
  });

  it('removes storage before exposing unauthenticated state', async () => {
    useAuthStore.setState({ session, status: 'authenticated' } as Partial<AuthStoreContract>);
    let stateWhileRemoving: AuthSession | null | undefined;
    mockedRemovePersistedSession.mockImplementation(async () => {
      stateWhileRemoving = authState().session;
    });

    await authState().clearSession();

    expect(mockedRemovePersistedSession).toHaveBeenCalledTimes(1);
    expect(stateWhileRemoving).toEqual(session);
    expect(authState()).toMatchObject({ session: null, status: 'unauthenticated' });
  });

  it('keeps the prior authenticated state when session removal fails', async () => {
    useAuthStore.setState({ session, status: 'authenticated' } as Partial<AuthStoreContract>);
    mockedRemovePersistedSession.mockRejectedValue(new Error('storage unavailable'));

    await expect(authState().clearSession()).rejects.toThrow('storage unavailable');

    expect(authState()).toMatchObject({ session, status: 'authenticated' });
  });
});
