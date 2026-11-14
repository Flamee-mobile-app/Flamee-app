import { Text } from "tamagui";
import { AppIconButton } from "../../../shared/components";

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
  return <AppIconButton selected={selected} disabled={disabled} accessibilityLabel={emoji} onPress={onPress}
    icon={<Text fontSize="$h4" aria-hidden={true}>{emoji}</Text>} />;
}
