import { Clock3, Heart, MapPin } from "@tamagui/lucide-icons-2";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, SectionCard } from "../../../shared/components";
import { formatMessage, getMessage, type MessageKey } from "../../../shared/localization/messages";
import type { Mood } from "../../checkins";
import type { PartnerStatusView } from "../types";

type MoodColor = "$moodVeryBad" | "$moodBad" | "$moodNeutral" | "$moodGood" | "$moodGreat";

const moodCopy: Record<Mood, { emoji: string; label: MessageKey; color: MoodColor }> = {
  1: { emoji: "😣", label: "moodVeryBad", color: "$moodVeryBad" },
  2: { emoji: "😔", label: "moodBad", color: "$moodBad" },
  3: { emoji: "😐", label: "moodNeutral", color: "$moodNeutral" },
  4: { emoji: "🙂", label: "moodGood", color: "$moodGood" },
  5: { emoji: "😊", label: "moodGreat", color: "$moodGreat" },
};

const reasonKeys: Record<string, MessageKey> = {
  work: "reasonWork",
  study: "reasonStudy",
  tired: "reasonTired",
  stress: "reasonStress",
  anxious: "reasonAnxious",
  lonely: "reasonLonely",
  miss_you: "reasonMissYou",
  happy: "reasonHappy",
  calm: "reasonCalm",
  health: "reasonHealth",
  family: "reasonFamily",
  friends: "reasonFriends",
  money: "reasonMoney",
  other: "reasonOther",
};

export function PartnerStatusCard({ status, onSignal }: { status: PartnerStatusView; onSignal: () => void }) {
  const partnerName = status.partner.nickname || status.partner.displayName;
  const difference = Math.abs(status.timezoneDifferenceHours);
  const differenceText = formatMessage(
    "vi",
    status.timezoneDifferenceHours < 0 ? "timezoneBehind" : "timezoneAhead",
    { hours: difference },
  );

  if (status.kind === "no_update") {
    return (
      <SectionCard tone="lavender" title={getMessage("vi", "partnerNoUpdate")} description={formatMessage("vi", "partnerNoUpdateBody", { name: partnerName })}>
        <XStack gap="$sm" alignItems="center">
          <Clock3 size={18} color="$textSecondary" />
          <Text fontSize="$bodyS" color="$textSecondary">
            {formatMessage("vi", "partnerLocalClock", { name: partnerName, time: status.partnerLocalTime })} · {differenceText}
          </Text>
        </XStack>
        <AppButton variant="secondary" icon={<Heart size={18} />} onPress={onSignal}>
          {getMessage("vi", "sendMissYou")}
        </AppButton>
      </SectionCard>
    );
  }

  const mood = moodCopy[status.mood];
  return (
    <SectionCard tone="peach">
      <XStack alignItems="center" gap="$md">
        <YStack width={64} height={64} borderRadius="$xl" backgroundColor={mood.color} alignItems="center" justifyContent="center">
          <Text fontSize={32}>{mood.emoji}</Text>
        </YStack>
        <YStack flex={1} gap="$xs">
          <Text fontFamily="$heading" fontSize="$h4" fontWeight="$bold">{getMessage("vi", mood.label)}</Text>
          <Text fontSize="$bodyS" color="$textSecondary">
            {formatMessage("vi", "updatedMinutesAgo", { minutes: status.minutesAgo })}
          </Text>
        </YStack>
      </XStack>
      {status.kind === "full" && status.reasonIds.length ? (
        <XStack flexWrap="wrap" gap="$sm">
          {status.reasonIds.map((id) => (
            <YStack key={id} borderRadius="$xl" backgroundColor="$surface" paddingHorizontal="$md" paddingVertical="$sm">
              <Text fontSize="$bodyS">{getMessage("vi", reasonKeys[id] ?? "reasonOther")}</Text>
            </YStack>
          ))}
        </XStack>
      ) : null}
      {status.kind === "full" && status.note ? (
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">“{status.note}”</Text>
      ) : null}
      <XStack gap="$sm" alignItems="center">
        <MapPin size={16} color="$textSecondary" />
        <Text flex={1} fontSize="$bodyS" color="$textSecondary">
          {formatMessage("vi", "partnerLocalClock", { name: partnerName, time: status.partnerLocalTime })} · {differenceText}
        </Text>
      </XStack>
    </SectionCard>
  );
}
