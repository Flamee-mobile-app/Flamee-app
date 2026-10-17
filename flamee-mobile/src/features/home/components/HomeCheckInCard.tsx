import { ArrowUpRight } from "@tamagui/lucide-icons-2/icons/ArrowUpRight";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Text, XStack, YStack } from "tamagui";
import { AppButton } from "../../../shared/components";
import { homeShadows, homeTokens } from "../../../shared/constants/tokens";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import { MoodFace, type Mood } from "../../checkins";

const moods = [
  { value: 1, label: "moodVeryBad", surface: "$moodVeryBadSurface" },
  { value: 2, label: "moodBad", surface: "$moodBadSurface" },
  { value: 3, label: "moodNeutral", surface: "$moodNeutralSurface" },
  { value: 4, label: "moodGood", surface: "$moodGoodSurface" },
  { value: 5, label: "moodGreat", surface: "$moodGreatSurface" },
] as const satisfies readonly { value: Mood; label: MessageKey; surface: string }[];

export function HomeCheckInCard({ completed, compact = false, onCheckIn }: { completed: boolean; compact?: boolean; onCheckIn: (mood?: Mood) => void }) {
  return (
    <YStack backgroundColor="$accentSoft" borderRadius="$xl" paddingHorizontal="$lg" paddingVertical={compact ? "$lg" : "$xl"} gap={compact ? "$md" : "$lg"} {...homeShadows.hero}>
      <XStack alignItems="center" justifyContent="space-between" gap="$sm">
        <Text fontFamily="$body" fontSize="$bodyS" fontWeight="$medium" color="$accentText">
          {getMessage("vi", "homeCheckInEyebrow")}
        </Text>
        {completed ? <Check size={18} color="$accentText" /> : <YStack width={8} height={8} borderRadius="$sm" backgroundColor="$accentText" />}
      </XStack>
      <YStack gap="$sm">
        <Text role="heading" aria-level={2} fontFamily="$heading" fontSize={compact ? "$h5" : "$h3"} lineHeight={compact ? "$h5" : "$h3"} fontWeight="$bold" color="$textPrimary">
          {getMessage("vi", compact ? completed ? "homeCheckInCompactComplete" : "homeCheckInCompactTitle" : completed ? "homeCheckInCompleteTitle" : "homeCheckInQuestion")}
        </Text>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
          {getMessage("vi", completed ? "checkInTodaySavedBody" : "homeCheckInDescription")}
        </Text>
      </YStack>
      {!completed && !compact ? (
        <XStack justifyContent="space-between" role="group" aria-label={getMessage("vi", "checkInTitle")}>
          {moods.map(({ value, label, surface }) => (
            <YStack
              key={value}
              flex={1}
              minWidth="$control"
              minHeight="$control"
              borderRadius="$md"
              alignItems="center"
              justifyContent="center"
              role="button"
              aria-label={getMessage("vi", label)}
              pressStyle={{ backgroundColor: "$supportPeach", opacity: 0.8 }}
              focusStyle={{ outlineColor: "$primary", outlineWidth: 2, outlineStyle: "solid" }}
              onPress={() => onCheckIn(value)}
            >
              <YStack width={homeTokens.moodTileSize} height={homeTokens.moodTileSize} borderRadius="$md" backgroundColor={surface} alignItems="center" justifyContent="center" aria-hidden={true}>
                <MoodFace mood={value} size={homeTokens.moodIconSize} />
              </YStack>
            </YStack>
          ))}
        </XStack>
      ) : null}
      <AppButton variant={compact ? "secondary" : "primary"} iconAfter={<ArrowUpRight size={18} />} onPress={() => onCheckIn()}>
        {getMessage("vi", completed ? "homeUpdateCheckIn" : "checkInNow")}
      </AppButton>
      {!completed && !compact ? <Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" color="$accentText" textAlign="center">{getMessage("vi", "homeSharingChoice")}</Text> : null}
    </YStack>
  );
}
