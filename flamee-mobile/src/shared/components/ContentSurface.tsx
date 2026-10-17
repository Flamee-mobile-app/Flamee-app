import { YStack, type YStackProps } from "tamagui";
import { featureTokens } from "../constants/tokens";

export function ContentSurface(props: YStackProps) {
  return (
    <YStack
      backgroundColor="$surface"
      borderRadius="$xl"
      padding="$lg"
      gap="$lg"
      {...featureTokens.surfaceShadow}
      {...props}
    />
  );
}
