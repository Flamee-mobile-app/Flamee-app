import { Platform } from "react-native";
import { Button } from "tamagui";
import { resolvePlatformAccessibilityProps } from "../../../shared/components";
import { buttonTokens } from "../../../shared/constants/tokens";

export type MomentReactionButtonProps = {
  emoji: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function MomentReactionButton({
  emoji,
  selected = false,
  disabled = false,
  onPress,
}: MomentReactionButtonProps) {
  return (
    <Button
      circular
      width={buttonTokens.height}
      height={buttonTokens.height}
      minWidth={buttonTokens.height}
      minHeight={buttonTokens.height}
      borderWidth={1}
      borderColor={selected ? "$primary" : "$border"}
      backgroundColor={selected ? "$accentSoft" : "$surface"}
      fontSize={22}
      transition={["200ms", { duration: buttonTokens.interactionDuration }]}
      animateOnly={["transform", "opacity"]}
      pressStyle={{ translateY: buttonTokens.pressOffset, opacity: 0.88 }}
      focusStyle={{ borderColor: "$secondary", borderWidth: 2 }}
      opacity={disabled ? buttonTokens.disabledOpacity : 1}
      role="button"
      aria-label={emoji}
      aria-pressed={selected}
      aria-disabled={disabled}
      {...resolvePlatformAccessibilityProps(Platform.OS, { selected, disabled })}
      disabled={disabled}
      onPress={onPress}
    >
      {emoji}
    </Button>
  );
}
