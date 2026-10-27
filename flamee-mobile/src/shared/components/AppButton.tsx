import type { PropsWithChildren, ReactNode } from "react";
import { Platform } from "react-native";
import { Button, Spinner, Text, XStack } from "tamagui";
import { buttonTokens, glassTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import {
  getAppButtonPresentation,
  getAppButtonDisabledPresentation,
  resolveAppButtonLayout,
  resolveAppButtonState,
  resolvePlatformAccessibilityProps,
  type AppButtonContentAlign,
  type AppButtonVariant,
} from "./buttonSystemModel";

export type AppButtonProps = PropsWithChildren<{
  variant?: AppButtonVariant;
  size?: "regular" | "large" | "compact";
  depth?: "raised" | "flat";
  disabledTone?: "default" | "muted";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  fill?: boolean;
  grow?: boolean;
  contentAlign?: AppButtonContentAlign;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}>;

export function AppButton({
  children,
  variant = "primary",
  size = "regular",
  depth = "raised",
  disabledTone = "default",
  loading = false,
  disabled = false,
  icon,
  iconAfter,
  fill = false,
  grow = false,
  contentAlign = "center",
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: AppButtonProps) {
  const presentation = getAppButtonPresentation(variant);
  const state = resolveAppButtonState({ disabled, loading });
  const disabledPresentation = state.disabled ? getAppButtonDisabledPresentation(disabledTone) : undefined;
  const contentColor = disabledPresentation?.color ?? presentation.base.color;
  const layout = resolveAppButtonLayout({ fill, grow, contentAlign });
  const interaction = useButtonInteraction(state.disabled);
  const { elevation: pressedElevation, ...pressStyle } = presentation.press;
  const webGlass = variant === "ghost" && Platform.OS === "web";

  return (
    <Button
      unstyled
      testID={testID}
      height={size === "large" ? buttonTokens.largeHeight : size === "compact" ? buttonTokens.choiceHeight : buttonTokens.height}
      minHeight={size === "large" ? buttonTokens.largeHeight : size === "compact" ? buttonTokens.choiceHeight : buttonTokens.height}
      borderRadius={buttonTokens.radius}
      borderWidth={presentation.base.borderWidth ?? 0}
      borderColor={presentation.base.borderColor ?? "transparent"}
      outlineWidth={0}
      outlineStyle="none"
      backgroundColor={disabledPresentation?.backgroundColor ?? presentation.base.backgroundColor}
      backdropFilter={webGlass ? glassTokens.buttonBackdrop : undefined}
      backgroundImage={webGlass ? glassTokens.buttonSheen : undefined}
      boxShadow={webGlass ? glassTokens.buttonShadow : undefined}
      color={contentColor}
      paddingHorizontal={size === "compact" ? buttonTokens.iconGap : buttonTokens.paddingHorizontal}
      fontFamily="$body"
      fontSize="$button"
      fontWeight="$semibold"
      shadowColor={webGlass ? undefined : presentation.base.shadowColor}
      shadowOffset={webGlass ? undefined : presentation.base.shadowOffset}
      shadowOpacity={webGlass ? undefined : depth === "flat" ? 0 : disabledPresentation?.shadowOpacity ?? presentation.base.shadowOpacity}
      shadowRadius={webGlass ? undefined : depth === "flat" ? 0 : disabledPresentation?.shadowRadius ?? presentation.base.shadowRadius}
      elevation={Platform.OS === "android" ? depth === "flat" ? 0 : disabledPresentation?.elevation ?? presentation.base.elevation : undefined}
      alignSelf={layout.alignSelf}
      flex={layout.flex}
      minWidth={layout.minWidth}
      justifyContent={layout.justifyContent}
      alignItems="center"
      flexDirection="row"
      transform={[{ translateY: 0 }]}
      {...interaction}
      animateOnly={["transform", "opacity"]}
      hoverStyle={presentation.hover}
      pressStyle={{
        ...(webGlass ? {
          backgroundColor: pressStyle.backgroundColor,
          transform: pressStyle.transform,
          boxShadow: glassTokens.buttonPressedShadow,
        } : pressStyle),
        ...(Platform.OS === "android" ? { elevation: pressedElevation } : {}),
        ...(depth === "flat" ? { shadowOpacity: 0, shadowRadius: 0, ...(Platform.OS === "android" ? { elevation: 0 } : {}) } : {}),
      }}
      focusStyle={{ borderWidth: 0, outlineWidth: 0, outlineStyle: "none" }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabledPresentation?.opacity ?? 1}
      cursor={state.disabled ? "default" : "pointer"}
      role="button"
      aria-label={accessibilityLabel}
      aria-busy={state.busy}
      aria-disabled={state.disabled}
      accessibilityHint={accessibilityHint}
      {...resolvePlatformAccessibilityProps(Platform.OS, { busy: state.busy, disabled: state.disabled })}
      disabled={state.disabled}
      onPress={onPress}
    >
      <XStack
        width={contentAlign === "start" ? "100%" : undefined}
        minWidth={0}
        alignItems="center"
        justifyContent={contentAlign === "start" ? "flex-start" : "center"}
        gap={buttonTokens.iconGap}
        opacity={state.contentOpacity}
      >
        {icon}
        <Text
          flex={contentAlign === "start" ? 1 : undefined}
          minWidth={0}
          fontFamily="$body"
          fontSize="$button"
          lineHeight="$button"
          fontWeight="$semibold"
          color={contentColor}
          textAlign={contentAlign === "start" ? "left" : "center"}
        >
          {children}
        </Text>
        {iconAfter}
      </XStack>
      {state.busy ? <Spinner position="absolute" size="small" color={contentColor} /> : null}
    </Button>
  );
}
