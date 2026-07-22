import { Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BottomNav } from '@/shared/components/ui/BottomNav';
import { BottomNavLayoutProvider } from '@/shared/layouts';
import { isMainNavigationPath } from '@/shared/lib/navigation/routes';

export default function MainLayout() {
  const pathname = usePathname();

  return (
    <BottomNavLayoutProvider>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Disable animation for main tab screens to feel like native tabs */}
          <Stack.Screen name="home" options={{ animation: 'none' }} />
          <Stack.Screen name="timeline" options={{ animation: 'none' }} />
          <Stack.Screen name="mood" options={{ animation: 'none' }} />
          <Stack.Screen name="missions" options={{ animation: 'none' }} />
          <Stack.Screen name="profile" options={{ animation: 'none' }} />

          {/* Enable default slide animations for pushed sub-pages */}
          <Stack.Screen name="ai" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="dates" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="memory-book" options={{ animation: 'slide_from_right' }} />
        </Stack>
        {isMainNavigationPath(pathname) && <BottomNav />}
      </View>
    </BottomNavLayoutProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
