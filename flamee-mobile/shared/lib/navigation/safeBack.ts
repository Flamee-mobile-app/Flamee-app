import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

import { ROUTES } from './routes';

export type RouterLike = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

export function handleSafeBack(router: RouterLike, fallback: Href = ROUTES.home) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

export function useSafeBack(fallback: Href = ROUTES.home) {
  const router = useRouter();

  return useCallback(() => {
    handleSafeBack(router, fallback);
  }, [router, fallback]);
}
