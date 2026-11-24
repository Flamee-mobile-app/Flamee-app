import type { PropsWithChildren, ReactNode } from "react";
import { Platform, View } from "react-native";
import { Button, Spinner, Text } from "tamagui";
import { buttonTokens, glassTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import { resolveSurfaceShadow } from "./surfaceShadow";
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
  depth?: "raised" | "subtle" | "flat";
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
  const { elevation: _pressedElevation, shadowColor, shadowOffset, shadowOpacity, shadowRadius, ...pressStyle } = presentation.press;
  const shadow = resolveSurfaceShadow(Platform.OS, {
    shadowColor: presentation.base.shadowColor,
    shadowOffset: depth === "subtle" ? buttonTokens.subtleShadow.shadowOffset : presentation.base.shadowOffset,
    shadowOpacity: depth === "flat" ? 0 : disabledPresentation?.shadowOpacity ?? (depth === "subtle" ? buttonTokens.subtleShadow.shadowOpacity : presentation.base.shadowOpacity),
    shadowRadius: depth === "flat" ? 0 : disabledPresentation?.shadowRadius ?? (depth === "subtle" ? buttonTokens.subtleShadow.shadowRadius : presentation.base.shadowRadius),
  });
  const pressedShadow = resolveSurfaceShadow(Platform.OS, {
    shadowColor,
    shadowOffset: depth === "subtle" ? buttonTokens.subtlePressedShadow.shadowOffset : shadowOffset,
    shadowOpacity: depth === "flat" ? 0 : depth === "subtle" ? buttonTokens.subtlePressedShadow.shadowOpacity : shadowOpacity,
    shadowRadius: depth === "flat" ? 0 : depth === "subtle" ? buttonTokens.subtlePressedShadow.shadowRadius : shadowRadius,
  });
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
      {...(!webGlass ? shadow : {})}
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
        } : { ...pressStyle, ...pressedShadow }),
      }}
      focusStyle={{ borderWidth: 0, outlineWidth: 0, outlineStyle: "none" }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabledPresentation?.opacity ?? 1}
      cursor={state.disabled ? "default" : "pointer"}
      role="button"
      aria-label={accessibilityLabel ?? (typeof children === "string" ? children : undefined)}
      aria-busy={state.busy}
      aria-disabled={state.disabled}
      accessibilityHint={accessibilityHint}
      {...resolvePlatformAccessibilityProps(Platform.OS, { busy: state.busy, disabled: state.disabled })}
      disabled={state.disabled}
      onPress={onPress}
    >
      <View
        collapsable={false}
        style={{
          width: contentAlign === "start" ? "100%" : undefined,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: contentAlign === "start" ? "flex-start" : "center",
          gap: buttonTokens.iconGap,
          opacity: state.contentOpacity,
        }}
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
      </View>
      {state.busy ? <Spinner position="absolute" size="small" color={contentColor} /> : null}
    </Button>
  );
}
