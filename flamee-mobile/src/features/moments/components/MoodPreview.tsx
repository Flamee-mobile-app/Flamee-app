import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppButton } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { resolveEmotionDefinition, resolveMascotSticker, type EmotionCheckInFormValue } from "../../checkins";

type Props = { draft: EmotionCheckInFormValue; onChoose: () => void };
const emotionArtwork: Record<string, string> = {
  overwhelmed: "mascot-overwhelmed", sad: "mascot-sad", tired: "mascot-tired", calm: "mascot-calm",
  uncertain: "mascot-shy", loved: "mascot-loved", hopeful: "mascot-excited", happy: "mascot-excited",
};

/** Artwork is illustrative; only the user's unsent selection can label a mood. */
export function MoodOverview({ draft, onChoose }: Props) {
  const emotion = resolveEmotionDefinition(draft.emotionId);
  const mood = emotion ? getMessage("vi", emotion.labelKey) : draft.customEmotionLabel?.trim();
  const ownSticker = resolveMascotSticker(draft.mascotStickerId ?? emotionArtwork[draft.emotionId] ?? "mascot-neutral");
  const partnerSticker = resolveMascotSticker("mascot-loved");
  return <YStack gap="$lg">
    <XStack alignItems="center" justifyContent="space-around" paddingVertical="$sm">
      <YStack flex={1} minWidth={0} alignItems="center" gap="$xs">
        {ownSticker ? <Image source={ownSticker.source()} resizeMode="contain" accessible={false} style={styles.artwork} /> : null}
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "moodPreviewYou")}</Text>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" numberOfLines={1}>{mood || getMessage("vi", "moodChooseHint")}</Text>
      </YStack>
      <YStack width={1} height={72} backgroundColor="$border" />
      <YStack flex={1} minWidth={0} alignItems="center" gap="$xs">
        {partnerSticker ? <Image source={partnerSticker.source()} resizeMode="contain" accessible={false} style={styles.artwork} /> : null}
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "moodPreviewPartner")}</Text>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" numberOfLines={1}>{getMessage("vi", "moodPreviewUnavailable")}</Text>
      </YStack>
    </XStack>
    <AppButton fill variant="secondary" onPress={onChoose} testID="moments-choose-mood">{getMessage("vi", "moodPreviewChoose")}</AppButton>
    {mood ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" textAlign="center">{getMessage("vi", "moodPreviewDraft")}</Text> : null}
  </YStack>;
}

const styles = { artwork: { width: 64, height: 64 } };
