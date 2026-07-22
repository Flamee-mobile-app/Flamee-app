import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../styles/global.css';

import { fontAssets } from '@/shared/assets';
import { AuthBootstrap } from '@/features/auth/components/AuthBootstrap';
import { AuthGate } from '@/features/auth/components/AuthGate';
import { queryClient } from '@/shared/lib/api/queryClient';
import { ROOT_MAIN_SCREEN_OPTIONS } from '@/shared/lib/navigation/mainStackOptions';

// Prevent splash screen from auto-hiding until custom fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" options={ROOT_MAIN_SCREEN_OPTIONS} />
          </Stack>
          <AuthGate />
          <StatusBar style="dark" />
        </AuthBootstrap>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
