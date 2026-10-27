import { Image } from "react-native";
import { ScrollView, Text, YStack } from "tamagui";
import { AppField, AppFilterChip } from "../../../shared/components";
import { moodFlowTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import type { CheckInDraft } from "../checkInFlowModel";
import { checkInFeelingCatalog, resolveCheckInFeeling } from "../checkInFeelingCatalog";
import { emotionCatalog } from "../emotionCatalog";

export function CheckInFeelingPicker({ draft, onChange }: { draft: CheckInDraft; onChange: (draft: CheckInDraft) => void }) {
  return <YStack width="100%" role="radiogroup" aria-label={getMessage("vi", "emotionChooseLabel")}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
      {checkInFeelingCatalog.map((emotion) => <AppFilterChip key={emotion.id} selectionMode="single" label={getMessage("vi", emotion.labelKey)} selected={draft.emotionId === emotion.id}
        onPress={() => onChange({ ...draft, emotionId: emotion.id, customEmotionLabel: "" })} />)}
      <AppFilterChip selectionMode="single" label={getMessage("vi", "emotionCustom")} selected={draft.emotionId === "custom"} onPress={() => onChange({ ...draft, emotionId: "custom" })} />
    </ScrollView>
  </YStack>;
}

export function CheckInStepContent({ draft, onChange }: { draft: CheckInDraft; onChange: (draft: CheckInDraft) => void }) {
  const selectedFeeling = resolveCheckInFeeling(draft.emotionId);
  const sticker = selectedFeeling ?? resolveCheckInFeeling("unbothered")!;
  const emotion = selectedFeeling ?? emotionCatalog.find((item) => item.id === draft.emotionId);
  const update = (change: Partial<CheckInDraft>) => onChange({ ...draft, ...change });

  return <YStack gap="$sm" width="100%" alignItems="center">
    <Text role="heading" aria-level={1} aria-live="polite" fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary" textAlign="center">
      {getMessage("vi", "moodFlowFeelingTitle")}
    </Text>
    <YStack width="100%" height={moodFlowTokens.mascotStageHeight} alignItems="center" justifyContent="center">
      <YStack position="absolute" width={moodFlowTokens.mascotShadowWidth} height={moodFlowTokens.mascotShadowHeight} borderRadius={moodFlowTokens.mascotShadowHeight / 2} backgroundColor="$textPrimary" opacity={0.08} bottom={8}
        shadowColor="$textPrimary" shadowOffset={{ width: 0, height: 2 }} shadowOpacity={0.12} shadowRadius={8} />
      <Image source={sticker.source()} resizeMode="contain" accessibilityLabel={`${getMessage("vi", "moodFlowStickerLabel")}: ${getMessage("vi", sticker.labelKey)}`} style={{ width: moodFlowTokens.mascotSize, height: moodFlowTokens.mascotSize }} />
    </YStack>
    {draft.emotionId === "custom" ? <AppField labelSize="large" label={`${getMessage("vi", "emotionCustomLabel")} · ${getMessage("vi", "moodFlowRequired")}`} placeholder={getMessage("vi", "emotionCustomPlaceholder")} value={draft.customEmotionLabel} onChangeText={(customEmotionLabel) => update({ customEmotionLabel })} maxLength={32} surfaceTone="bright" /> : null}
  </YStack>;
}
