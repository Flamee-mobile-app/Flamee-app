import { Clock3 } from "@tamagui/lucide-icons-2/icons/Clock3";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, SectionCard } from "../../../shared/components";
import { colors, homeTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage, type MessageKey } from "../../../shared/localization/messages";
import { MoodFace, type Mood } from "../../checkins";
import type { PartnerStatusView } from "../types";

const moodCopy: Record<Mood, MessageKey> = {
  1: "moodVeryBad",
  2: "moodBad",
  3: "moodNeutral",
  4: "moodGood",
  5: "moodGreat",
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
  const differenceText = difference < 0.01 ? getMessage("vi", "homeSameTimezone") : formatMessage(
    "vi",
    status.timezoneDifferenceHours < 0 ? "timezoneBehind" : "timezoneAhead",
    { hours: Math.round(difference * 100) / 100 },
  );

  return (
    <SectionCard>
      <XStack alignItems="center" gap="$md">
        <YStack width={homeTokens.avatarSize} height={homeTokens.avatarSize} borderRadius="$lg" backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center" overflow="hidden">
          {status.partner.avatarUri ? (
            <Image source={{ uri: status.partner.avatarUri }} style={{ width: homeTokens.avatarSize, height: homeTokens.avatarSize }} accessible={false} />
          ) : <Text fontFamily="$heading" fontSize="$h4" fontWeight="$semibold" color="$textSecondary">{partnerName.trim().charAt(0).toLocaleUpperCase("vi")}</Text>}
        </YStack>
        <YStack flex={1} minWidth={0} gap="$xs">
          <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">{partnerName}</Text>
          <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">
            {status.kind === "no_update" ? getMessage("vi", "partnerNoUpdate") : status.kind === "emotion" ? getMessage("vi", "partnerSharedANote") : getMessage("vi", moodCopy[status.mood])}
          </Text>
        </YStack>
        {status.kind !== "no_update" && status.kind !== "emotion" ? <MoodFace mood={status.mood} size={homeTokens.moodIconSize} color={colors.calmText} /> : null}
      </XStack>
      {status.kind === "no_update" ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{formatMessage("vi", "partnerNoUpdateBody", { name: partnerName })}</Text> : (
        <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{formatMessage("vi", "updatedMinutesAgo", { minutes: status.minutesAgo })}</Text>
      )}
      {status.kind === "full" && status.reasonIds.length ? (
        <XStack flexWrap="wrap" gap="$sm">
          {status.reasonIds.map((id) => (
            <YStack key={id} borderRadius="$sm" backgroundColor="$surfaceMuted" paddingHorizontal="$sm" paddingVertical="$xs">
              <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", reasonKeys[id] ?? "reasonOther")}</Text>
            </YStack>
          ))}
        </XStack>
      ) : null}
      {status.kind === "full" && status.note ? (
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">“{status.note}”</Text>
      ) : null}
      {status.kind === "emotion" ? (
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary" numberOfLines={2}>“{status.note}”</Text>
      ) : null}
      <YStack borderTopWidth={1} borderColor="$border" paddingTop="$md" gap="$xs">
        <XStack gap="$sm" alignItems="center">
          <Clock3 size={14} color="$textSecondary" />
          <Text flex={1} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">
            {formatMessage("vi", "partnerLocalClock", { name: partnerName, time: status.partnerLocalTime })}
          </Text>
        </XStack>
        <Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" color="$textSecondary">{differenceText}</Text>
      </YStack>
      {status.kind === "no_update" ? <AppButton variant="secondary" icon={<Heart size={16} />} onPress={onSignal}>{getMessage("vi", "sendMissYou")}</AppButton> : null}
    </SectionCard>
  );
}
