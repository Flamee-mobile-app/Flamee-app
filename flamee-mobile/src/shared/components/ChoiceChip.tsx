import { Check } from "@tamagui/lucide-icons-2";
import { Button } from "tamagui";

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function ChoiceChip({ label, selected, onPress, disabled }: ChoiceChipProps) {
  return (
    <Button
      minHeight="$control"
      borderRadius="$xl"
      borderWidth={1}
      borderColor={selected ? "$primary" : "$border"}
      backgroundColor={selected ? "$supportPeachLight" : "$surface"}
      color="$textPrimary"
      fontFamily="$body"
      fontSize="$bodyM"
      icon={selected ? <Check size={18} color="$primary" /> : undefined}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
