import { Check } from "@tamagui/lucide-icons-2/icons/Check";
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
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
