import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { getMessage, formatMessage } from "../../../shared/localization/messages";
import type { ServerMood } from "../moodApi";
import { resolveCheckInFeeling } from "../checkInFeelingCatalog";
import { resolveEmotionDefinition } from "../emotionCatalog";
import { resolveMascotSticker } from "../mascotCatalog";
import { moodEmojiCatalog } from "../moodEmojiCatalog";
import { localCheckInReasons } from "../types";
import { ServerMoodIcon } from "./ServerMoodIcon";

export function MoodAttachments({ mood, size = 48 }: { mood: ServerMood; size?: number }) {
  if (mood.share_level !== "all" && !mood.is_private) return null;
  return <XStack flexWrap="wrap" justifyContent="center" gap="$sm">
    {(mood.attachments ?? []).map((attachment) => {
      const item = attachment.kind === "gif" ? resolveCheckInFeeling(attachment.id)
        : attachment.kind === "sticker" ? resolveMascotSticker(attachment.id)
        : Object.values(moodEmojiCatalog).find((emoji) => emoji.emojiId === attachment.id);
      return item ? <Image key={`${attachment.kind}:${attachment.id}`} source={item.source()} resizeMode="contain" style={{ width: size, height: size }} /> : null;
    })}
  </XStack>;
}

export function moodDisplayLabel(mood: ServerMood) {
  const feeling = resolveCheckInFeeling(mood.mood) ?? resolveEmotionDefinition(mood.mood);
  return mood.mood === "custom" && mood.custom_emotion_label ? mood.custom_emotion_label : feeling ? getMessage("vi", feeling.labelKey) : getMessage("vi", "emotionCustom");
}

export function MoodCheckInDetails({ mood }: { mood: ServerMood }) {
  const full = mood.share_level === "all" || mood.is_private;
  const reasons = (mood.reasons ?? []).map((id) => localCheckInReasons.find((reason) => reason.id === id)).filter((reason) => reason !== undefined);
  return <YStack gap="$lg">
    <XStack alignItems="center" gap="$md">
      <ServerMoodIcon emotionId={mood.mood} size={72} label={moodDisplayLabel(mood)} />
      <YStack flex={1} gap="$xs">
        <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{moodDisplayLabel(mood)}</Text>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{new Date(mood.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</Text>
      </YStack>
    </XStack>
    <YStack gap="$sm">
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{getMessage("vi", "moodFlowScoreSectionTitle")}: {mood.mood_score}/5</Text>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{getMessage("vi", "moodFlowIntensitySectionTitle")}: {mood.intensity}/5</Text>
      {full && mood.sleep_hours !== null && mood.sleep_hours !== undefined ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{getMessage("vi", "moodFlowSleepSectionTitle")}: {mood.sleep_hours === 8 ? getMessage("vi", "moodFlowSleepPlusValue") : formatMessage("vi", "moodFlowSleepValue", { value: mood.sleep_hours })}</Text> : null}
    </YStack>
    {full && reasons.length ? <YStack gap="$xs">
      <Text fontFamily="$body" fontSize="$label" lineHeight="$label" fontWeight="$semibold" color="$textSecondary">{getMessage("vi", "moodFlowReasonChoicesTitle")}</Text>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{reasons.map((reason) => getMessage("vi", reason.labelKey)).join(" · ")}</Text>
    </YStack> : null}
    {full && mood.note?.trim() ? <YStack gap="$xs">
      <Text fontFamily="$body" fontSize="$label" lineHeight="$label" fontWeight="$semibold" color="$textSecondary">{getMessage("vi", "moodStepNote")}</Text>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{mood.note}</Text>
    </YStack> : null}
    {full ? <MoodAttachments mood={mood} size={64} /> : null}
  </YStack>;
}
