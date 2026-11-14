import type { ReactNode } from "react";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Platform } from "react-native";
import { Button, Text, XStack, YStack } from "tamagui";
import { buttonTokens, glassTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import { getFilterChipPresentation, resolveFilterSemantics, resolvePlatformAccessibilityProps, type FilterChipPresentation, type FilterSelectionMode } from "./buttonSystemModel";

export type AppFilterChipProps = {
  label: string;
  selected: boolean;
  selectionMode: FilterSelectionMode;
  presentation?: FilterChipPresentation;
  disabled?: boolean;
  fill?: boolean;
  icon?: ReactNode;
  showCheck?: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  testID?: string;
};

export function AppFilterChip({
  label,
  selected,
  selectionMode,
  presentation: presentationType = "filter",
  disabled = false,
  fill = false,
  icon,
  showCheck = true,
  accessibilityLabel,
  onPress,
  testID,
}: AppFilterChipProps) {
  const semantics = resolveFilterSemantics(selectionMode, selected);
  const presentation = getFilterChipPresentation(selected, presentationType);
  const choice = presentationType === "choice";
  const segmented = presentationType === "segment" || presentationType === "tab";
  const surfaceHeight = choice || segmented ? buttonTokens.choiceHeight : buttonTokens.filterHeight;
  const hitHeight = choice || segmented ? buttonTokens.choiceHeight : buttonTokens.filterHeight + buttonTokens.filterHitSlop * 2;
  const horizontalPadding = segmented ? 4 : choice ? buttonTokens.choicePaddingHorizontal : buttonTokens.filterPaddingHorizontal;
  const radius = choice ? buttonTokens.choiceRadius : buttonTokens.filterRadius;
  const textSize = choice ? "$bodyL" : "$bodyM";
  const textLineHeight = choice ? "$bodyL" : "$bodyM";
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
      width={fill ? "100%" : undefined}
      height={hitHeight}
      minHeight={hitHeight}
      minWidth={choice ? buttonTokens.choiceHeight : buttonTokens.height}
      borderRadius={radius}
      borderWidth={0}
      borderColor={presentation.borderColor}
      backgroundColor="transparent"
      color={presentation.color}
      padding={0}
      fontFamily="$body"
      fontSize={textSize}
      fontWeight="$medium"
      {...interaction}
      animateOnly={["transform", "opacity"]}
      pressStyle={{ transform: [{ translateY: buttonTokens.filterPressOffset }] }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      role={semantics.role}
      aria-label={accessibilityLabel}
      aria-checked={semantics.checked}
      aria-disabled={disabled}
      {...resolvePlatformAccessibilityProps(Platform.OS, { checked: semantics.checked, disabled })}
      disabled={disabled}
      onPress={onPress}
    >
      <YStack
        position="relative"
        width={fill ? "100%" : undefined}
        height={surfaceHeight}
        minWidth={choice ? buttonTokens.choiceHeight : buttonTokens.height}
        paddingHorizontal={horizontalPadding}
        borderRadius={radius}
        borderWidth={presentation.borderWidth}
        borderColor={presentation.borderColor}
        backgroundColor={choice || segmented ? presentation.backgroundColor : "$glassFilter"}
        backdropFilter={choice || segmented ? undefined : `blur(${glassTokens.filterBlur}px)`}
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <YStack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          borderRadius={radius}
          backgroundColor={presentation.selectionBackgroundColor}
          opacity={choice || segmented ? 0 : presentation.selectionOpacity}
          transition={["200ms", { duration: buttonTokens.filterSelectionDuration }]}
          animateOnly={["opacity"]}
        />
        {presentationType === "tab" && selected ? <YStack position="absolute" left={0} right={0} bottom={0} height={2} backgroundColor="$primary" /> : null}
        <XStack alignItems="center" justifyContent="center" gap={choice ? buttonTokens.choiceIconGap : "$xs"}>
          {icon}
          <YStack alignItems="center" justifyContent="center">
            {/* Reserve the semibold width so selecting never shifts adjacent labels. */}
            <Text fontFamily="$body" fontSize={textSize} lineHeight={textLineHeight} fontWeight="$semibold" opacity={0} aria-hidden>{label}</Text>
            <Text position="absolute" fontFamily="$body" fontSize={textSize} lineHeight={textLineHeight} fontWeight={selected ? "$semibold" : "$medium"} color={presentation.color}>{label}</Text>
          </YStack>
          {choice && showCheck && selected ? <Check size={buttonTokens.choiceIconSize} strokeWidth={2.5} color="$white" aria-hidden={true} /> : null}
        </XStack>
      </YStack>
    </Button>
  );
}
