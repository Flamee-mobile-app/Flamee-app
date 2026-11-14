import { Text, XStack, YStack } from "tamagui";
import { AppChoiceTile } from "../../../shared/components";
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
    <XStack flexWrap="wrap" justifyContent="center" gap="$sm" role="radiogroup">
      {moods.map((mood) => {
        const selected = mood.value === value;
        return (
          <AppChoiceTile key={mood.value} label={getMessage("vi", mood.label)} selected={selected} onPress={() => onChange(mood.value)}
            artwork={<YStack width={46} height={46} borderRadius="$xl" backgroundColor={mood.color} alignItems="center" justifyContent="center"><Text fontSize={24}>{mood.emoji}</Text></YStack>} />
        );
      })}
    </XStack>
  );
}
