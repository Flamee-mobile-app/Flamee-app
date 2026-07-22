import { Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BottomNav } from '@/shared/components/ui/BottomNav';
import { AuthGroupGuard } from '@/features/auth/components/AuthGroupGuard';
import { BottomNavLayoutProvider } from '@/shared/layouts';
import {
  DETAIL_MAIN_SCREEN_OPTIONS,
  PERSISTENT_MAIN_SCREEN_OPTIONS,
} from '@/shared/lib/navigation/mainStackOptions';
import { isMainNavigationPath } from '@/shared/lib/navigation/routes';
import { usePersistentMainBackGuard } from '@/shared/lib/navigation/usePersistentMainBackGuard';

export default function MainLayout() {
  const pathname = usePathname();
  usePersistentMainBackGuard(pathname);

  return (
    <AuthGroupGuard group="main">
      <BottomNavLayoutProvider>
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Disable animation for main tab screens to feel like native tabs */}
            <Stack.Screen name="home" options={PERSISTENT_MAIN_SCREEN_OPTIONS} />
            <Stack.Screen name="timeline" options={PERSISTENT_MAIN_SCREEN_OPTIONS} />
            <Stack.Screen name="mood" options={PERSISTENT_MAIN_SCREEN_OPTIONS} />
            <Stack.Screen name="missions" options={PERSISTENT_MAIN_SCREEN_OPTIONS} />
            <Stack.Screen name="profile" options={PERSISTENT_MAIN_SCREEN_OPTIONS} />

            {/* Enable default slide animations for pushed sub-pages */}
            <Stack.Screen name="ai" options={DETAIL_MAIN_SCREEN_OPTIONS} />
            <Stack.Screen name="dates" options={DETAIL_MAIN_SCREEN_OPTIONS} />
            <Stack.Screen name="memory-book" options={DETAIL_MAIN_SCREEN_OPTIONS} />
          </Stack>
          {isMainNavigationPath(pathname) && <BottomNav />}
        </View>
      </BottomNavLayoutProvider>
    </AuthGroupGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
