import { YStack, type YStackProps } from "tamagui";
import { featureTokens } from "../constants/tokens";

export function ContentSurface({ children, ...props }: YStackProps) {
  return (
    <YStack
      backgroundColor="$surface"
      borderRadius="$xl"
      padding="$lg"
      gap="$lg"
      {...featureTokens.surfaceShadow}
      {...props}
    >
      {children}
    </YStack>
  );
}
