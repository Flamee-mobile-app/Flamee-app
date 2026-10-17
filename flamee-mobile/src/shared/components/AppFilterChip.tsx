import { Platform } from "react-native";
import { Button, Text, YStack } from "tamagui";
import { buttonTokens, glassTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import { getFilterChipPresentation, resolveFilterSemantics, resolvePlatformAccessibilityProps, type FilterSelectionMode } from "./buttonSystemModel";

export type AppFilterChipProps = {
  label: string;
  selected: boolean;
  selectionMode: FilterSelectionMode;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
};

export function AppFilterChip({
  label,
  selected,
  selectionMode,
  disabled = false,
  onPress,
  testID,
}: AppFilterChipProps) {
  const semantics = resolveFilterSemantics(selectionMode, selected);
  const presentation = getFilterChipPresentation(selected);
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
      height={buttonTokens.filterHeight + buttonTokens.filterHitSlop * 2}
      minHeight={buttonTokens.filterHeight + buttonTokens.filterHitSlop * 2}
      minWidth={buttonTokens.height}
      borderRadius={buttonTokens.filterRadius}
      borderWidth={0}
      borderColor={presentation.borderColor}
      backgroundColor="transparent"
      color={presentation.color}
      padding={0}
      fontFamily="$body"
      fontSize="$bodyM"
      fontWeight="$medium"
      {...interaction}
      animateOnly={["transform", "opacity"]}
      pressStyle={{ transform: [{ translateY: buttonTokens.filterPressOffset }] }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: "none" }}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      role={semantics.role}
      aria-checked={semantics.checked}
      aria-disabled={disabled}
      {...resolvePlatformAccessibilityProps(Platform.OS, { checked: semantics.checked, disabled })}
      disabled={disabled}
      onPress={onPress}
    >
      <YStack
        position="relative"
        height={buttonTokens.filterHeight}
        minWidth={buttonTokens.height}
        paddingHorizontal={buttonTokens.filterPaddingHorizontal}
        borderRadius={buttonTokens.filterRadius}
        backgroundColor="$glassFilter"
        backdropFilter={`blur(${glassTokens.filterBlur}px)`}
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
          borderRadius={buttonTokens.filterRadius}
          backgroundColor={presentation.selectionBackgroundColor}
          opacity={presentation.selectionOpacity}
          transition={["200ms", { duration: buttonTokens.filterSelectionDuration }]}
          animateOnly={["opacity"]}
        />
        <YStack alignItems="center" justifyContent="center">
          {/* Reserve the semibold width so selecting never shifts adjacent labels. */}
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" opacity={0} aria-hidden={true}>
            {label}
          </Text>
          <Text position="absolute" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight={selected ? "$semibold" : "$medium"} color={presentation.color}>
            {label}
          </Text>
        </YStack>
      </YStack>
    </Button>
  );
}
