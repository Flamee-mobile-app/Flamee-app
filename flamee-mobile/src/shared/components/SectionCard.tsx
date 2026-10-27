import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { useState, type KeyboardEvent, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Card, Text, XStack, YStack } from "tamagui";
import { buttonTokens, cardTokens, glassTokens } from "../constants/tokens";
import { resolveFilterSemantics, resolvePlatformAccessibilityProps, type FilterSelectionMode } from "./buttonSystemModel";
import { useButtonInteraction } from "./useButtonInteraction";
import { AppCardBackdrop } from "./AppCardBackdrop";
import { AppGradientText } from "./AppGradientText";
import { getSectionCardPresentation, type SectionCardEmphasis } from "./sectionCardPresentation";

type SectionCardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  tone?: "default" | "peach" | "lavender" | "sage" | "brand" | "brandSoft" | "white" | "paper";
  showChevron?: boolean;
  density?: "default" | "compact";
  fill?: boolean;
  emphasis?: SectionCardEmphasis;
  testID?: string;
}> & ({
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  selected?: boolean;
  selectionMode?: FilterSelectionMode;
} | {
  onPress?: undefined;
  accessibilityLabel?: undefined;
  disabled?: undefined;
});

export function SectionCard({ title, description, tone = "default", density = "default", fill = false, emphasis = "default", showChevron = true, children, onPress, accessibilityLabel, disabled = false, testID, ...selection }: SectionCardProps) {
  const radius = density === "compact" ? cardTokens.compactRadius : cardTokens.radius;
  const interactive = !!onPress;
  const interaction = useButtonInteraction(!interactive || disabled);
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();
  const activePress = interactive && !disabled && pressed;
  const transition = reducedMotion ? undefined : interaction.transition;
  const presentation = getSectionCardPresentation(emphasis, activePress);
  const isBrandTone = tone === "brand" || tone === "brandSoft";
  const backgroundColor = tone === "paper" ? "$surface" : tone === "white" || isBrandTone ? "$white" : tone === "peach" ? "$glassCardPeach" : tone === "lavender" ? "$glassCardLavender" : tone === "sage" ? "$calmSurface" : "$glassCard";
  return (
    <Card
      unstyled
      testID={testID}
      flex={fill ? 1 : undefined}
      borderWidth={presentation.borderWidth}
      borderColor={presentation.borderColor}
      outlineWidth={0}
      outlineStyle="none"
      borderRadius={radius}
      backgroundColor={backgroundColor}
      backdropFilter={Platform.OS === "web" && tone !== "white" && !isBrandTone ? glassTokens.cardBackdrop : undefined}
      paddingHorizontal={density === "compact" ? cardTokens.compactPaddingHorizontal : cardTokens.padding}
      paddingVertical={density === "compact" ? cardTokens.compactPaddingVertical : cardTokens.padding}
      minHeight={buttonTokens.height}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      position="relative"
      transform={[{ translateY: activePress && !reducedMotion ? cardTokens.pressOffset : 0 }]}
      transition={interactive ? transition : undefined}
      animateOnly={["transform"]}
      {...(Platform.OS !== "web" ? {
        shadowColor: presentation.shadowColor,
        shadowOffset: presentation.shadowOffset,
        shadowOpacity: presentation.shadowOpacity,
        shadowRadius: presentation.shadowRadius,
        ...(Platform.OS === "android" ? { elevation: presentation.elevation } : {}),
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
        role: "selectionMode" in selection && selection.selectionMode ? resolveFilterSemantics(selection.selectionMode, !!selection.selected).role : "button" as const,
        ...("selectionMode" in selection && selection.selectionMode ? { "aria-checked": !!selection.selected } : {}),
        "aria-label": accessibilityLabel,
        "aria-disabled": disabled,
        ...resolvePlatformAccessibilityProps(Platform.OS, { disabled, selected: "selected" in selection && !!selection.selected }),
        disabled,
        cursor: disabled ? "default" : "pointer",
        disableClassName: interaction.disableClassName,
        onPress,
        onPressIn: () => { interaction.onPressIn(); setPressed(true); },
        onPressOut: () => { interaction.onPressOut(); setPressed(false); },
        hoverStyle: { backgroundColor, borderWidth: presentation.borderWidth, borderColor: presentation.borderColor },
        pressStyle: { backgroundColor, borderWidth: presentation.borderWidth, borderColor: presentation.borderColor },
        focusStyle: { borderWidth: presentation.borderWidth, borderColor: presentation.borderColor, outlineWidth: 0, outlineStyle: "none" as const },
        focusVisibleStyle: { borderWidth: presentation.borderWidth, borderColor: presentation.borderColor, outlineWidth: 0, outlineStyle: "none" as const },
      } : {})}
    >
      {isBrandTone ? <AppCardBackdrop radius={radius} opacity={tone === "brandSoft" ? cardTokens.softGradientOpacity : cardTokens.gradientOpacity} /> : null}
      {Platform.OS === "web" ? (
        <>
          <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius={radius} pointerEvents="none" boxShadow={presentation.webShadow} />
        </>
      ) : null}
      <XStack flex={fill ? 1 : undefined} alignItems={fill ? "stretch" : "center"} gap="$md" position="relative" zIndex={1}>
        <YStack flex={1} minWidth={0} gap="$sm">
          {title ? (
            <AppGradientText size="h5" weight="semibold">
              {title}
            </AppGradientText>
          ) : null}
          {description ? (
            <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="left">
              {description}
            </Text>
          ) : null}
          {children}
        </YStack>
        {interactive && showChevron && !("selectionMode" in selection && selection.selectionMode) ? emphasis === "action"
          ? <YStack width={32} height={32} borderRadius="$md" backgroundColor="$accentSoft" alignItems="center" justifyContent="center" aria-hidden><ChevronRight size={19} color="$accentText" /></YStack>
          : <ChevronRight size={18} color="$textSecondary" aria-hidden={true} /> : null}
      </XStack>
    </Card>
  );
}
