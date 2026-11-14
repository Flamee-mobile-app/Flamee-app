import type { PropsWithChildren } from "react";
import { Platform } from "react-native";
import { YStack } from "tamagui";
import { liquidHeaderTokens, memoryFeedTokens } from "../constants/tokens";

/** Home and feature headers share the same white pill material and dimensions. */
export function AppHeaderPill({ children, embedded = false }: PropsWithChildren<{ embedded?: boolean }>) {
  return <YStack position="relative" minHeight={embedded ? undefined : memoryFeedTokens.headerHeight} height={embedded ? "100%" : undefined}
    borderRadius={embedded ? 0 : liquidHeaderTokens.radius}
    {...(!embedded ? {
      shadowColor: liquidHeaderTokens.shadow.shadowColor,
      shadowOffset: liquidHeaderTokens.shadow.shadowOffset,
      shadowRadius: liquidHeaderTokens.shadow.shadowRadius,
      shadowOpacity: liquidHeaderTokens.shadow.shadowOpacity,
      ...(Platform.OS === "android" ? { elevation: liquidHeaderTokens.shadow.elevation } : {}),
    } : {})}>
    <YStack flex={1} borderRadius={embedded ? 0 : liquidHeaderTokens.radius} overflow="hidden" backgroundColor="$white">
      {children}
    </YStack>
  </YStack>;
}
