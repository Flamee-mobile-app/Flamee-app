import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Button, Text, XStack } from "tamagui";
import { buttonTokens, menuTokens } from "../constants/tokens";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";
import { useButtonInteraction } from "./useButtonInteraction";

type AppMenuRowProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  selected?: boolean;
};

/** A full-width navigation row with no separate button surface. */
export function AppMenuRow({ label, icon, onPress, disabled = false, testID, selected }: AppMenuRowProps) {
  const interaction = useButtonInteraction(disabled);
  const reducedMotion = useReducedMotion();
  const selectable = selected !== undefined;
  const backgroundColor = selected ? "$accentSoft" : "transparent";
  return (
    <Button
      unstyled
      testID={testID}
      width="100%"
      minHeight={menuTokens.rowMinHeight}
      paddingVertical="$md"
      paddingHorizontal={selectable ? "$sm" : 0}
      borderRadius={selectable ? "$md" : 0}
      borderWidth={0}
      outlineWidth={0}
      outlineStyle="none"
      backgroundColor={backgroundColor}
      color="$textPrimary"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      transform={[{ translateY: 0 }]}
      {...interaction}
      transition={reducedMotion ? undefined : interaction.transition}
      animateOnly={["transform"]}
      hoverStyle={{ backgroundColor }}
      pressStyle={{ backgroundColor, transform: [{ translateY: reducedMotion ? 0 : menuTokens.pressOffset }] }}
      focusStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      cursor={disabled ? "default" : "pointer"}
      role={selectable ? "radio" : "button"}
      aria-checked={selected}
      aria-label={label}
      aria-disabled={disabled}
      {...resolvePlatformAccessibilityProps(Platform.OS, { disabled, ...(selectable ? { checked: selected } : {}) })}
      disabled={disabled}
      onPress={onPress}
    >
      <XStack width="100%" minWidth={0} alignItems="center" gap="$md" pointerEvents="none">
        {icon}
        <Text flex={1} minWidth={0} fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight={selected ? "$semibold" : "$medium"} color={selected ? "$accentText" : "$textPrimary"} textAlign="left">
          {label}
        </Text>
        {selectable ? <XStack width={menuTokens.chevronSize} alignItems="center" justifyContent="center">{selected ? <Check size={menuTokens.chevronSize} color="$accentText" aria-hidden={true} /> : null}</XStack> : <ChevronRight size={menuTokens.chevronSize} color="$textSecondary" aria-hidden={true} />}
      </XStack>
    </Button>
  );
}
