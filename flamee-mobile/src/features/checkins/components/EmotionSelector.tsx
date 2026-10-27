import { AppGradientText } from "../../../shared/components";
import { Text, XStack, YStack } from "tamagui";
import { AppField, AppFilterChip } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { emotionCatalog } from "../emotionCatalog";

type EmotionSelectorProps = {
  emotionId: string;
  customEmotionLabel: string;
  onChange: (emotionId: string, customEmotionLabel: string | null) => void;
  error?: string;
};

export function EmotionSelector({ emotionId, customEmotionLabel, onChange, error }: EmotionSelectorProps) {
  return (
    <YStack gap="$md">
      <AppGradientText fontFamily="$heading" fontSize="$bodyL" fontWeight="$semibold" color="$textPrimary">
        {getMessage("vi", "emotionChooseLabel")}
      </AppGradientText>
      <XStack flexWrap="wrap" gap="$sm" role="group" aria-label={getMessage("vi", "emotionChooseLabel")}>
        {emotionCatalog.map((emotion) => (
          <AppFilterChip
            key={emotion.id}
            selectionMode="single"
            label={getMessage("vi", emotion.labelKey)}
            selected={emotionId === emotion.id}
            onPress={() => onChange(emotion.id, null)}
          />
        ))}
        <AppFilterChip
          selectionMode="single"
          label={getMessage("vi", "emotionCustom")}
          selected={emotionId === "custom"}
          onPress={() => onChange("custom", customEmotionLabel)}
        />
      </XStack>
      {emotionId === "custom" ? (
        <AppField
          label={getMessage("vi", "emotionCustomLabel")}
          placeholder={getMessage("vi", "emotionCustomPlaceholder")}
          value={customEmotionLabel}
          maxLength={32}
          surfaceTone="bright"
          onChangeText={(value) => onChange("custom", value)}
          error={error}
        />
      ) : error ? <Text color="$error" fontSize="$bodyS">{error}</Text> : null}
    </YStack>
  );
}
