import { Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Switch, YStack } from "tamagui";
import { buttonTokens, controlTokens } from "../constants/tokens";
import { resolvePlatformAccessibilityProps } from "./buttonSystemModel";
import { useButtonInteraction } from "./useButtonInteraction";

export type AppSwitchProps = {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  accessibilityLabel: string;
  testID?: string;
};

export function AppSwitch({ id, checked, disabled = false, onCheckedChange, accessibilityLabel, testID }: AppSwitchProps) {
  const interaction = useButtonInteraction(disabled);
  const reducedMotion = useReducedMotion();
  const tokens = controlTokens.switch;

  return (
    <Switch
      unstyled
      id={id}
      testID={testID}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      width={tokens.targetWidth}
      height={controlTokens.touchSize}
      paddingHorizontal={(tokens.targetWidth - tokens.trackWidth) / 2 + tokens.inset}
      paddingVertical={(controlTokens.touchSize - tokens.trackHeight) / 2 + tokens.inset}
      backgroundColor="transparent"
      activeStyle={{ backgroundColor: "transparent" }}
      hoverStyle={{ backgroundColor: "transparent" }}
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
      pressStyle={{ transform: [{ translateY: reducedMotion ? 0 : controlTokens.pressOffset }] }}
      focusStyle={{ borderWidth: 0, outlineWidth: 0, outlineStyle: "none" }}
      focusVisibleStyle={{ borderWidth: 0, outlineWidth: 0, outlineStyle: "none" }}
      role="switch"
      aria-label={accessibilityLabel}
      aria-checked={checked}
      aria-disabled={disabled}
      {...resolvePlatformAccessibilityProps(Platform.OS, { checked, disabled })}
    >
      <YStack
        position="absolute"
        left={-tokens.inset}
        top={-tokens.inset}
        width={tokens.trackWidth}
        height={tokens.trackHeight}
        borderRadius={tokens.trackHeight / 2}
        backgroundColor="$surfaceMuted"
        pointerEvents="none"
        overflow="hidden"
      >
        <YStack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          backgroundColor="$primary"
          opacity={checked ? 1 : 0}
          transition={reducedMotion ? undefined : ["200ms", { duration: tokens.duration }]}
          animateOnly={["opacity"]}
        />
        <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius={tokens.trackHeight / 2} boxShadow={Platform.OS === "web" ? tokens.trackShadow : undefined} />
      </YStack>
      <Switch.Thumb
        unstyled
        width={tokens.thumbSize}
        height={tokens.thumbSize}
        borderRadius={tokens.thumbSize / 2}
        backgroundColor="$white"
        borderWidth={0}
        pointerEvents="none"
        transition={reducedMotion ? undefined : ["200ms", { duration: tokens.duration }]}
        animateOnly={["transform"]}
        {...tokens.thumbShadow}
        elevation={Platform.OS === "android" ? 2 : undefined}
      />
    </Switch>
  );
}
