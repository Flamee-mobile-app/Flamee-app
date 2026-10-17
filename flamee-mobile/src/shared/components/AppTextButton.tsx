import type { PropsWithChildren, ReactNode } from "react";
import { Platform } from "react-native";
import { Button } from "tamagui";
import { buttonTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";

type AppTextButtonTone = "neutral" | "accent" | "danger";

export type AppTextButtonProps = PropsWithChildren<{
  tone?: AppTextButtonTone;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}>;

const toneColors = {
  neutral: "$textPrimary",
  accent: "$accentText",
  danger: "$error",
} as const;

export function AppTextButton({
  children,
  tone = "neutral",
  icon,
  iconAfter,
  disabled = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: AppTextButtonProps) {
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
      minHeight={buttonTokens.height}
      borderRadius={buttonTokens.radius}
      borderWidth={0}
      backgroundColor="transparent"
      color={toneColors[tone]}
      paddingHorizontal={buttonTokens.paddingHorizontal}
      fontFamily="$body"
      fontSize="$button"
      fontWeight="$semibold"
      gap={buttonTokens.iconGap}
      {...interaction}
      animateOnly={["transform", "opacity"]}
      pressStyle={{ transform: [{ translateY: buttonTokens.pressOffset }] }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      role="button"
      aria-label={accessibilityLabel}
      aria-disabled={disabled}
      accessibilityHint={accessibilityHint}
      {...resolvePlatformAccessibilityProps(Platform.OS, { disabled })}
      disabled={disabled}
      onPress={onPress}
    >
      {icon}
      {children}
      {iconAfter}
    </Button>
  );
}
