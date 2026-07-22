import { useEffect, type PropsWithChildren } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from '@/features/auth/store/authStore';

export function AuthBootstrap({ children }: PropsWithChildren) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'hydrating') return;

    void Promise.resolve(SplashScreen.hideAsync()).catch(() => {});
  }, [status]);

  if (status === 'hydrating') return null;

  return children;
}
