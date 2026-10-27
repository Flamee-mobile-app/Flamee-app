import type { PropsWithChildren } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { Button } from "tamagui";
import { memoryFeedTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";

/** A media-only action; controls such as retry/menu remain outside this button. */
export function AppMediaButton({ children, onPress, accessibilityLabel }: PropsWithChildren<{ onPress: () => void; accessibilityLabel: string }>) {
  const interaction = useButtonInteraction(false);
  const reducedMotion = useReducedMotion();
  return <Button unstyled width="100%" minWidth={0} minHeight={0} padding={0} borderWidth={0} outlineWidth={0} borderRadius={memoryFeedTokens.photoRadius} backgroundColor="transparent"
    flexDirection="column" alignItems="stretch" justifyContent="center" role="button" accessibilityLabel={accessibilityLabel} aria-label={accessibilityLabel}
    {...interaction} transform={[{ translateY: 0 }]} transition={reducedMotion ? undefined : interaction.transition} animateOnly={["transform"]}
    pressStyle={{ transform: [{ translateY: reducedMotion ? 0 : 1 }] }} focusStyle={{ outlineWidth: 0 }} focusVisibleStyle={{ outlineWidth: 0 }} onPress={onPress}>{children}</Button>;
}
