import { useEffect, type PropsWithChildren } from 'react';
import { type Href, useNavigationContainerRef, useRouter, useSegments } from 'expo-router';

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
  const navigationRef = useNavigationContainerRef();
  const router = useRouter();
  const segments = useSegments();
  const destination = getAuthRedirect(status, segments);

  useEffect(() => {
    if (!navigationRef.current || !destination) return;

    router.replace(destination);
  }, [destination, navigationRef, router]);

  if (status === 'hydrating') return null;

  return children;
}
