import { useEffect, type PropsWithChildren } from 'react';
import { type Href, useRootNavigationState, useRouter, useSegments } from 'expo-router';

import { useAuthStore, type AuthStatus } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/lib/navigation/routes';

export function getAuthRedirect(status: AuthStatus, segments: readonly string[]): Href | null {
  const group = segments[0];

  if (status === 'authenticated' && (group === '(auth)' || !group)) {
    return ROUTES.home;
  }

  if (status === 'unauthenticated' && group === '(main)') {
    return ROUTES.login;
  }

  return null;
}

export function AuthGate({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status);
  const rootNavigationState = useRootNavigationState();
  const router = useRouter();
  const segments = useSegments();
  const destination = getAuthRedirect(status, segments);

  useEffect(() => {
    if (!rootNavigationState?.key || !destination) return;

    router.replace(destination);
  }, [destination, rootNavigationState?.key, router]);

  if (status === 'hydrating') return null;

  return children;
}
