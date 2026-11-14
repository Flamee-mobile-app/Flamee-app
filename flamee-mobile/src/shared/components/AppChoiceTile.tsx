import type { ReactNode } from "react";
import { Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Button, Text, YStack } from "tamagui";
import { buttonTokens, choiceTokens } from "../constants/tokens";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";
import { useButtonInteraction } from "./useButtonInteraction";

type Props = { label: string; artwork: ReactNode; selected: boolean; disabled?: boolean; onPress: () => void; testID?: string };

/** Image choices use the approved filter material and press contract. */
export function AppChoiceTile({ label, artwork, selected, disabled = false, onPress, testID }: Props) {
  const interaction = useButtonInteraction(disabled);
  const reducedMotion = useReducedMotion();
  return (
    <Button unstyled testID={testID} width={choiceTokens.width} height={choiceTokens.height} padding="$sm" borderRadius={buttonTokens.filterRadius}
      borderWidth={0} outlineWidth={0} outlineStyle="none" backgroundColor="$glassFilter"
      role="radio" aria-checked={selected} aria-label={label} aria-disabled={disabled} disabled={disabled}
      {...resolvePlatformAccessibilityProps(Platform.OS, { checked: selected, disabled })}
      transform={[{ translateY: 0 }]} opacity={disabled ? buttonTokens.disabledOpacity : 1}
      {...interaction} transition={reducedMotion ? undefined : interaction.transition} animateOnly={["transform"]}
      pressStyle={{ transform: [{ translateY: reducedMotion ? 0 : buttonTokens.filterPressOffset }] }}
      focusStyle={{ outlineWidth: 0, borderWidth: 0 }} focusVisibleStyle={{ outlineWidth: 0, borderWidth: 0 }} onPress={onPress}>
      <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius={buttonTokens.filterRadius}
        backgroundColor="$accentSoft" opacity={selected ? 1 : 0} pointerEvents="none"
        transition={reducedMotion ? undefined : ["200ms", { duration: buttonTokens.filterSelectionDuration }]} animateOnly={["opacity"]} />
      <YStack position="relative" zIndex={1} alignItems="center" justifyContent="center" gap="$xs" pointerEvents="none">
        <YStack width={choiceTokens.artworkSize} height={choiceTokens.artworkSize} alignItems="center" justifyContent="center">{artwork}</YStack>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color={selected ? "$accentText" : "$textSecondary"} textAlign="center" numberOfLines={2}>{label}</Text>
      </YStack>
    </Button>
  );
}
