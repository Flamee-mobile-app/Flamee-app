import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { Platform } from "react-native";
import { Button } from "tamagui";
import { buttonTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";

type AppTextButtonTone = "neutral" | "accent" | "danger";

export type AppTextButtonProps = PropsWithChildren<{
  tone?: AppTextButtonTone;
  size?: "regular" | "compact";
  emphasis?: "normal" | "strong";
  icon?: ReactNode;
  iconAfter?: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  expanded?: boolean;
  controls?: string;
  buttonRef?: ComponentProps<typeof Button>["ref"];
}>;

const toneColors = {
  neutral: "$textPrimary",
  accent: "$accentText",
  danger: "$error",
} as const;

export function AppTextButton({
  children,
  tone = "neutral",
  size = "regular",
  emphasis = "normal",
  icon,
  iconAfter,
  disabled = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
  expanded,
  controls,
  buttonRef,
}: AppTextButtonProps) {
  const interaction = useButtonInteraction(disabled);
  return (
    <Button
      ref={buttonRef}
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
      paddingHorizontal={size === "compact" ? buttonTokens.iconGap / 2 : buttonTokens.paddingHorizontal}
      fontFamily="$body"
      fontSize={size === "compact" ? "$bodyM" : "$button"}
      fontWeight={emphasis === "strong" ? "$bold" : "$semibold"}
      gap={buttonTokens.iconGap}
      {...interaction}
      animateOnly={["transform", "opacity"]}
      pressStyle={{ transform: [{ translateY: buttonTokens.pressOffset }] }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      role="button"
      aria-label={accessibilityLabel}
      aria-disabled={disabled}
      aria-expanded={expanded}
      {...(Platform.OS === "web" ? { "aria-controls": controls } : {})}
      accessibilityHint={accessibilityHint}
      {...resolvePlatformAccessibilityProps(Platform.OS, { disabled, ...(expanded === undefined ? {} : { expanded }) })}
      disabled={disabled}
      onPress={onPress}
    >
      {icon}
      {children}
      {iconAfter}
    </Button>
  );
}
