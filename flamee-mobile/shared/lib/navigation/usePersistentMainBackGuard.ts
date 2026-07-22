import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

const PERSISTENT_MAIN_PATHNAMES = new Set([
  '/home',
  '/timeline',
  '/mood',
  '/missions',
  '/profile',
]);

export function usePersistentMainBackGuard(pathname: string) {
  const shouldGuardBack =
    Platform.OS === 'android' && PERSISTENT_MAIN_PATHNAMES.has(pathname);

  useFocusEffect(
    useCallback(() => {
      if (!shouldGuardBack) {
        return undefined;
      }

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);

      return () => subscription.remove();
    }, [shouldGuardBack]),
  );
}
