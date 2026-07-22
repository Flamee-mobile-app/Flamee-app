import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AUTH_SESSION_STORAGE_KEY,
  persistSession,
  readPersistedSession,
  removePersistedSession,
} from './authSessionStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('authSessionStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists only the public AuthSession fields', async () => {
    await persistSession(
      {
        userId: 'demo-user',
        displayName: 'An & Bình',
        email: 'an@example.com',
        password: 'secret1',
      } as Parameters<typeof persistSession>[0],
    );

    expect(storage.setItem).toHaveBeenCalledWith(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        displayName: 'An & Bình',
        email: 'an@example.com',
      }),
    );
  });

  it('returns a valid persisted session', async () => {
    storage.getItem.mockResolvedValue(
      JSON.stringify({
        userId: 'demo-user',
        displayName: 'An & Bình',
        email: 'an@example.com',
        password: 'stale-secret',
      }),
    );

    await expect(readPersistedSession()).resolves.toEqual({
      userId: 'demo-user',
      displayName: 'An & Bình',
      email: 'an@example.com',
    });
  });

  it('removes malformed persisted JSON and returns null', async () => {
    storage.getItem.mockResolvedValue('{not-json');

    await expect(readPersistedSession()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
  });

  it('removes persisted values without every string session field', async () => {
    storage.getItem.mockResolvedValue(JSON.stringify({ userId: 'demo-user', email: 'an@example.com' }));

    await expect(readPersistedSession()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
  });

  it('removes the current persisted session', async () => {
    await removePersistedSession();

    expect(storage.removeItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
  });
});
