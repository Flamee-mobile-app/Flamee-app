import { Text, XStack, YStack } from "tamagui";
import type { Mood } from "../types";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";

type MoodColor = "$moodVeryBad" | "$moodBad" | "$moodNeutral" | "$moodGood" | "$moodGreat";

const moods: Array<{ value: Mood; emoji: string; label: MessageKey; color: MoodColor }> = [
  { value: 1, emoji: "😣", label: "moodVeryBad", color: "$moodVeryBad" },
  { value: 2, emoji: "😔", label: "moodBad", color: "$moodBad" },
  { value: 3, emoji: "😐", label: "moodNeutral", color: "$moodNeutral" },
  { value: 4, emoji: "🙂", label: "moodGood", color: "$moodGood" },
  { value: 5, emoji: "😊", label: "moodGreat", color: "$moodGreat" },
];

type MoodSelectorProps = { value?: Mood; onChange: (value: Mood) => void };

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <XStack flexWrap="wrap" justifyContent="center" gap="$sm">
      {moods.map((mood) => {
        const selected = mood.value === value;
        return (
          <YStack
            key={mood.value}
            width="30%"
            minWidth={96}
            minHeight={104}
            borderRadius="$lg"
            borderWidth={selected ? 2 : 1}
            borderColor={selected ? "$primary" : "$border"}
            backgroundColor={selected ? "$supportPeachLight" : "$surface"}
            alignItems="center"
            justifyContent="center"
            gap="$xs"
            pressStyle={{ opacity: 0.82, scale: 0.98 }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={getMessage("vi", mood.label)}
            onPress={() => onChange(mood.value)}
          >
            <YStack width={46} height={46} borderRadius="$xl" backgroundColor={mood.color} alignItems="center" justifyContent="center">
              <Text fontSize={24}>{mood.emoji}</Text>
            </YStack>
            <Text textAlign="center" fontFamily="$body" fontSize="$bodyS" fontWeight="$semibold" color="$textPrimary">
              {getMessage("vi", mood.label)}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  );
}
