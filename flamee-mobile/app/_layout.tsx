import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppScreen, AppToastProvider } from "../src/shared/components";
import { FoundationScreen } from "../src/shared/components/FoundationScreen";
import { SessionInitializer } from "../src/providers/SessionInitializer";
import { TamaguiProvider } from "../src/providers/TamaguiProvider";
import { QueryProvider } from "../src/providers/QueryProvider";
import { AppHeaderProvider } from "../src/providers/AppHeaderProvider";
import { colors } from "../src/shared/constants/tokens";
import { revealStartupError, StartupProvider } from "../src/providers/StartupProvider";
import { View } from "react-native";

type RootErrorBoundaryProps = { error: Error; retry: () => void };

export function ErrorBoundary({ retry }: RootErrorBoundaryProps) {
  return (
    <QueryProvider>
      <TamaguiProvider>
        <SafeAreaProvider>
          <AppToastProvider>
            <StatusBar style="dark" hidden={false} />
            <View style={{ flex: 1 }} onLayout={revealStartupError}>
              <AppScreen scroll={false} padded={false}>
                <FoundationScreen
                  title="recoveredTitle"
                  description="recoveredDescription"
                  actionLabel="retry"
                  onAction={retry}
                />
              </AppScreen>
            </View>
          </AppToastProvider>
        </SafeAreaProvider>
      </TamaguiProvider>
    </QueryProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Native sheet portals mount at Tamagui's root host. Query context must
          wrap that host as well as the navigation subtree. */}
      <QueryProvider>
        <TamaguiProvider>
          <SafeAreaProvider>
            <AppToastProvider>
              <SessionInitializer>
                <StatusBar style="dark" />
                <StartupProvider>
                  <AppHeaderProvider>
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
                  </AppHeaderProvider>
                </StartupProvider>
              </SessionInitializer>
            </AppToastProvider>
          </SafeAreaProvider>
        </TamaguiProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
