import type { PropsWithChildren } from 'react';

import { useAuthStore } from '@/features/auth/store/authStore';

type AuthGroupGuardProps = PropsWithChildren<{
  group: 'auth' | 'main';
}>;

export function AuthGroupGuard({ children, group }: AuthGroupGuardProps) {
  const status = useAuthStore((state) => state.status);

  if (status === 'hydrating') return null;

  const canRender =
    (group === 'auth' && status === 'unauthenticated') ||
    (group === 'main' && status === 'authenticated');

  return canRender ? children : null;
}
