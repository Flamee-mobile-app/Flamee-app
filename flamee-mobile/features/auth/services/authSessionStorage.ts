import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthSession } from '@/features/auth/types';

export const AUTH_SESSION_STORAGE_KEY = '@flamee/auth-session/v1';

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;

  const session = value as Record<string, unknown>;

  return (
    typeof session.userId === 'string' &&
    typeof session.displayName === 'string' &&
    typeof session.email === 'string'
  );
}

export async function readPersistedSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isAuthSession(parsed)) {
      return {
        userId: parsed.userId,
        displayName: parsed.displayName,
        email: parsed.email,
      };
    }
  } catch {}

  await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  return null;
}

export function persistSession(session: AuthSession) {
  return AsyncStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      userId: session.userId,
      displayName: session.displayName,
      email: session.email,
    }),
  );
}

export function removePersistedSession() {
  return AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}
