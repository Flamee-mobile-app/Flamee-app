import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { useState, type KeyboardEvent, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Card, Text, XStack, YStack } from "tamagui";
import { buttonTokens, cardTokens, glassTokens } from "../constants/tokens";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";
import { useButtonInteraction } from "./useButtonInteraction";

type SectionCardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  tone?: "default" | "peach" | "lavender";
  testID?: string;
}> & ({
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
} | {
  onPress?: undefined;
  accessibilityLabel?: undefined;
  disabled?: undefined;
});

export function SectionCard({ title, description, tone = "default", children, onPress, accessibilityLabel, disabled = false, testID }: SectionCardProps) {
  const interactive = !!onPress;
  const interaction = useButtonInteraction(!interactive || disabled);
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();
  const activePress = interactive && !disabled && pressed;
  const transition = reducedMotion ? undefined : interaction.transition;
  const nativeShadow = activePress ? cardTokens.nativePressedShadow : cardTokens.nativeShadow;
  const backgroundColor =
    tone === "peach" ? "$glassCardPeach" : tone === "lavender" ? "$glassCardLavender" : "$glassCard";
  return (
    <Card
      unstyled
      testID={testID}
      borderWidth={0}
      borderColor="transparent"
      outlineWidth={0}
      outlineStyle="none"
      borderRadius={cardTokens.radius}
      backgroundColor={backgroundColor}
      backdropFilter={Platform.OS === "web" ? glassTokens.cardBackdrop : undefined}
      padding={cardTokens.padding}
      minHeight={buttonTokens.height}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      position="relative"
      transform={[{ translateY: activePress && !reducedMotion ? cardTokens.pressOffset : 0 }]}
      transition={interactive ? transition : undefined}
      animateOnly={["transform"]}
      {...(Platform.OS !== "web" ? {
        shadowColor: nativeShadow.shadowColor,
        shadowOffset: nativeShadow.shadowOffset,
        shadowOpacity: nativeShadow.shadowOpacity,
        shadowRadius: nativeShadow.shadowRadius,
        ...(Platform.OS === "android" ? { elevation: nativeShadow.elevation } : {}),
      } : {})}
      {...(interactive ? {
        render: "button",
        ...(Platform.OS === "web" ? {
          type: "button" as const,
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            if (disabled || event.repeat) return;
            interaction.onPressIn();
            setPressed(true);
            if (event.key === "Enter") onPress?.();
          },
          onKeyUp: (event: KeyboardEvent<HTMLElement>) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            interaction.onPressOut();
            setPressed(false);
            if (!disabled && event.key === " ") onPress?.();
          },
          onBlur: () => { interaction.onPressOut(); setPressed(false); },
          onTouchCancel: () => { interaction.onPressOut(); setPressed(false); },
          onPointerCancel: () => { interaction.onPressOut(); setPressed(false); },
        } : {}),
        role: "button" as const,
        "aria-label": accessibilityLabel,
        "aria-disabled": disabled,
        ...resolvePlatformAccessibilityProps(Platform.OS, { disabled }),
        disabled,
        cursor: disabled ? "default" : "pointer",
        disableClassName: interaction.disableClassName,
        onPress,
        onPressIn: () => { interaction.onPressIn(); setPressed(true); },
        onPressOut: () => { interaction.onPressOut(); setPressed(false); },
        hoverStyle: { backgroundColor, borderWidth: 0 },
        pressStyle: { backgroundColor, borderWidth: 0 },
        focusStyle: { borderWidth: 0, outlineWidth: 0, outlineStyle: "none" as const },
        focusVisibleStyle: { borderWidth: 0, outlineWidth: 0, outlineStyle: "none" as const },
      } : {})}
    >
      {Platform.OS === "web" ? (
        <>
          <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius={cardTokens.radius} pointerEvents="none" boxShadow={cardTokens.shadow} opacity={activePress ? 0 : 1} transition={interactive ? transition : undefined} animateOnly={["opacity"]} />
          <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius={cardTokens.radius} pointerEvents="none" boxShadow={cardTokens.pressedShadow} opacity={activePress ? 1 : 0} transition={interactive ? transition : undefined} animateOnly={["opacity"]} />
        </>
      ) : null}
      <XStack alignItems="center" gap="$md" position="relative" zIndex={1}>
        <YStack flex={1} minWidth={0} gap="$sm">
          {title ? (
            <Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary" textAlign="left">
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="left">
              {description}
            </Text>
          ) : null}
          {children}
        </YStack>
        {interactive ? <ChevronRight size={18} color="$textSecondary" aria-hidden={true} /> : null}
      </XStack>
    </Card>
  );
}
