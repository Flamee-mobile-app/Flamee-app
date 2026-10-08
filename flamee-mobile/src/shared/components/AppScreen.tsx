import type { PropsWithChildren, ReactElement } from "react";
import type { RefreshControlProps } from "react-native";
import { ScrollView, YStack, type YStackProps } from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";
import { AmbientBackground } from "./AmbientBackground";

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  contentProps?: YStackProps;
  refreshControl?: ReactElement<RefreshControlProps>;
}>;

export function AppScreen({ children, scroll = true, padded = true, contentProps, refreshControl }: AppScreenProps) {
  const content = (
    <YStack
      flexGrow={1}
      backgroundColor="transparent"
      paddingHorizontal={padded ? "$lg" : 0}
      paddingVertical={padded ? "$lg" : 0}
      gap="$lg"
      {...contentProps}
    >
      {children}
    </YStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background" overflow="hidden">
      <AmbientBackground />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        {scroll ? (
          <ScrollView flex={1} backgroundColor="transparent" keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
            {content}
          </ScrollView>
        ) : (
          <YStack flex={1} backgroundColor="transparent">
            {content}
          </YStack>
        )}
      </SafeAreaView>
    </YStack>
  );
}
