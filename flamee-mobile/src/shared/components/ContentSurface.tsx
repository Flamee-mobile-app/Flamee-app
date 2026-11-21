import { YStack, type YStackProps } from "tamagui";
import { featureTokens } from "../constants/tokens";
import { Platform } from "react-native";
import { resolveSurfaceShadow } from "./surfaceShadow";

export function ContentSurface({ children, ...props }: YStackProps) {
  return (
    <YStack
      backgroundColor="$surface"
      borderRadius="$xl"
      padding="$lg"
      gap="$lg"
      {...resolveSurfaceShadow(Platform.OS, featureTokens.surfaceShadow)}
      {...props}
    >
      {children}
    </YStack>
  );
}
