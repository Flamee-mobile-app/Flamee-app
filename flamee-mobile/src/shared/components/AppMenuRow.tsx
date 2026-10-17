import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
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
};

/** A full-width navigation row with no separate button surface. */
export function AppMenuRow({ label, icon, onPress, disabled = false, testID }: AppMenuRowProps) {
  const interaction = useButtonInteraction(disabled);
  const reducedMotion = useReducedMotion();
  return (
    <Button
      unstyled
      testID={testID}
      width="100%"
      minHeight={menuTokens.rowMinHeight}
      paddingVertical="$md"
      paddingHorizontal={0}
      borderRadius={0}
      borderWidth={0}
      outlineWidth={0}
      outlineStyle="none"
      backgroundColor="transparent"
      color="$textPrimary"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      transform={[{ translateY: 0 }]}
      {...interaction}
      transition={reducedMotion ? undefined : interaction.transition}
      animateOnly={["transform"]}
      hoverStyle={{ backgroundColor: "transparent" }}
      pressStyle={{ backgroundColor: "transparent", transform: [{ translateY: reducedMotion ? 0 : menuTokens.pressOffset }] }}
      focusStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      cursor={disabled ? "default" : "pointer"}
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      {...resolvePlatformAccessibilityProps(Platform.OS, { disabled })}
      disabled={disabled}
      onPress={onPress}
    >
      <XStack width="100%" minWidth={0} alignItems="center" gap="$md" pointerEvents="none">
        {icon}
        <Text flex={1} minWidth={0} fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$medium" color="$textPrimary" textAlign="left">
          {label}
        </Text>
        <ChevronRight size={menuTokens.chevronSize} color="$textSecondary" aria-hidden={true} />
      </XStack>
    </Button>
  );
}
