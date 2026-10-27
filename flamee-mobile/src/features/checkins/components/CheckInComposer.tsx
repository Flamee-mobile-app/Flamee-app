import { ChevronDown } from "@tamagui/lucide-icons-2/icons/ChevronDown";
import { ChevronUp } from "@tamagui/lucide-icons-2/icons/ChevronUp";
import { useState } from "react";
import { Text, YStack } from "tamagui";
import { AppField, AppTextButton } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import type { EmotionCheckInFormValue } from "../types";
import { EmotionSelector } from "./EmotionSelector";
import { MascotStickerPicker } from "./MascotStickerPicker";

/** Editable UI draft only. No persistence, mutation, success or queued state. */
export function CheckInComposer({ value, onChange }: { value: EmotionCheckInFormValue; onChange: (value: EmotionCheckInFormValue) => void }) {
  const [stickersOpen, setStickersOpen] = useState(false);
  const Chevron = stickersOpen ? ChevronUp : ChevronDown;
  return <YStack gap="$lg">
    <EmotionSelector emotionId={value.emotionId} customEmotionLabel={value.customEmotionLabel ?? ""}
      onChange={(emotionId, customEmotionLabel) => onChange({ ...value, emotionId, customEmotionLabel })} />
    <AppField multiline label={getMessage("vi", "emotionNoteLabel")} placeholder={getMessage("vi", "emotionNotePlaceholder")}
      surfaceTone="bright" maxLength={100} characterCount={`${Array.from(value.note).length}/100`} value={value.note} onChangeText={(note) => onChange({ ...value, note })} />
    <AppTextButton expanded={stickersOpen} controls="mood-draft-stickers" onPress={() => setStickersOpen((open) => !open)} iconAfter={<Chevron size={18} color="$accentText" />}>
      {getMessage("vi", "mascotOptionalTitle")}
    </AppTextButton>
    {stickersOpen ? <YStack id="mood-draft-stickers"><MascotStickerPicker value={value.mascotStickerId} onChange={(mascotStickerId) => onChange({ ...value, mascotStickerId })} /></YStack> : null}
    <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "moodPreviewDraftHint")}</Text>
  </YStack>;
}
