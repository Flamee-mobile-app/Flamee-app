import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppScreen } from "../src/shared/components";
import { FoundationScreen } from "../src/shared/components/FoundationScreen";
import { SessionInitializer } from "./providers/SessionInitializer";
import { TamaguiProvider } from "./providers/TamaguiProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { colors } from "../src/shared/constants/tokens";
import { revealStartupError, StartupProvider } from "./providers/StartupProvider";
import { View } from "react-native";

type RootErrorBoundaryProps = { error: Error; retry: () => void };

export function ErrorBoundary({ retry }: RootErrorBoundaryProps) {
  return (
    <TamaguiProvider>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <TamaguiProvider>
        <SafeAreaProvider>
          <QueryProvider>
            <SessionInitializer>
              <StatusBar style="dark" />
              <StartupProvider>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
              </StartupProvider>
            </SessionInitializer>
          </QueryProvider>
        </SafeAreaProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
