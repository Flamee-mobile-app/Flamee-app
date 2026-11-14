import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Minus } from "@tamagui/lucide-icons-2/icons/Minus";
import { Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Checkbox, YStack } from "tamagui";
import { buttonTokens, controlTokens } from "../constants/tokens";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";
import { useButtonInteraction } from "./useButtonInteraction";

export type AppCheckboxState = boolean | "indeterminate";

export type AppCheckboxProps = {
  id?: string;
  checked: AppCheckboxState;
  disabled?: boolean;
  onCheckedChange?: (checked: AppCheckboxState) => void;
  accessibilityLabel: string;
  testID?: string;
};

export function AppCheckbox({ id, checked, disabled = false, onCheckedChange, accessibilityLabel, testID }: AppCheckboxProps) {
  const interaction = useButtonInteraction(disabled);
  const reducedMotion = useReducedMotion();
  const tokens = controlTokens.checkbox;
  const selected = checked !== false;

  return (
    <Checkbox
      unstyled
      id={id}
      testID={testID}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      width={controlTokens.touchSize}
      height={controlTokens.touchSize}
      padding={(controlTokens.touchSize - tokens.size) / 2}
      alignItems="center"
      justifyContent="center"
      backgroundColor="transparent"
      borderWidth={0}
      borderColor="transparent"
      outlineWidth={0}
      outlineStyle="none"
      cursor={disabled ? "default" : "pointer"}
      transform={[{ translateY: 0 }]}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      {...interaction}
      transition={reducedMotion ? undefined : interaction.transition}
      animateOnly={["transform"]}
      hoverStyle={{ backgroundColor: "transparent", borderWidth: 0, borderColor: "transparent" }}
      pressStyle={{ backgroundColor: "transparent", borderWidth: 0, borderColor: "transparent", transform: [{ translateY: reducedMotion ? 0 : controlTokens.pressOffset }] }}
      focusStyle={{ borderWidth: 0, outlineWidth: 0, outlineStyle: "none" }}
      focusVisibleStyle={{ borderWidth: 0, outlineWidth: 0, outlineStyle: "none" }}
      aria-label={accessibilityLabel}
      aria-disabled={disabled}
      {...resolvePlatformAccessibilityProps(Platform.OS, { disabled })}
    >
      <YStack width={tokens.size} height={tokens.size} borderRadius={tokens.radius} backgroundColor="$surfaceMuted" pointerEvents="none">
        <YStack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          borderRadius={tokens.radius}
          backgroundColor="$accentSoft"
          opacity={selected ? 1 : 0}
          transition={reducedMotion ? undefined : ["200ms", { duration: tokens.duration }]}
          animateOnly={["opacity"]}
        />
        <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius={tokens.radius} boxShadow={Platform.OS === "web" ? tokens.surfaceShadow : undefined} />
        <Checkbox.Indicator
          unstyled
          forceMount
          disablePassStyles
          position="absolute"
          top={0}
          left={0}
          width={tokens.size}
          height={tokens.size}
          alignItems="center"
          justifyContent="center"
          opacity={selected ? 1 : 0}
          transition={reducedMotion ? undefined : ["200ms", { duration: tokens.duration }]}
          animateOnly={["opacity"]}
        >
          {checked === "indeterminate" ? <Minus size={tokens.iconSize} color="$accentText" aria-hidden={true} /> : <Check size={tokens.iconSize} color="$accentText" aria-hidden={true} />}
        </Checkbox.Indicator>
      </YStack>
    </Checkbox>
  );
}
