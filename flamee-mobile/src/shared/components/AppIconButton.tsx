import type { ReactNode } from "react";
import { Platform } from "react-native";
import { Button } from "tamagui";
import { buttonTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import { getIconButtonPresentation, resolvePlatformAccessibilityProps, type IconButtonTone } from "./buttonSystemModel";

export type AppIconButtonProps = {
  icon: ReactNode;
  tone?: IconButtonTone;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  testID?: string;
};

export function AppIconButton({
  icon,
  tone = "neutral",
  selected = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: AppIconButtonProps) {
  const presentation = getIconButtonPresentation(tone, selected);
  const interaction = useButtonInteraction(disabled);

  return (
    <Button
      unstyled
      testID={testID}
      outlineWidth={0}
      outlineStyle="none"
      alignItems="center"
      justifyContent="center"
      flexDirection="row"
      transform={[{ translateY: 0 }]}
      cursor={disabled ? "default" : "pointer"}
      width={buttonTokens.iconButtonSize}
      height={buttonTokens.iconButtonSize}
      minWidth={buttonTokens.iconButtonSize}
      minHeight={buttonTokens.iconButtonSize}
      borderRadius={buttonTokens.iconButtonRadius}
      borderWidth={0}
      backgroundColor={presentation.backgroundColor}
      color={presentation.color}
      padding={0}
      hitSlop={buttonTokens.iconButtonHitSlop}
      {...interaction}
      animateOnly={["transform", "opacity"]}
      hoverStyle={{ backgroundColor: presentation.hoverBackgroundColor }}
      pressStyle={{ transform: [{ translateY: buttonTokens.pressOffset }] }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      role="button"
      aria-label={accessibilityLabel}
      aria-disabled={disabled}
      aria-pressed={selected}
      accessibilityHint={accessibilityHint}
      {...resolvePlatformAccessibilityProps(Platform.OS, { selected, disabled })}
      disabled={disabled}
      onPress={onPress}
    >
      {icon}
    </Button>
  );
}
