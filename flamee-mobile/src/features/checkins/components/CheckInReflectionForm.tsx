import { BatteryLow } from "@tamagui/lucide-icons-2/icons/BatteryLow";
import { BookOpen } from "@tamagui/lucide-icons-2/icons/BookOpen";
import { Brain } from "@tamagui/lucide-icons-2/icons/Brain";
import { BriefcaseBusiness } from "@tamagui/lucide-icons-2/icons/BriefcaseBusiness";
import { House } from "@tamagui/lucide-icons-2/icons/House";
import { UsersRound } from "@tamagui/lucide-icons-2/icons/UsersRound";
import { Zap } from "@tamagui/lucide-icons-2/icons/Zap";
import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppFilterChip, AppSlider } from "../../../shared/components";
import { buttonTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { checkInReasonOptions, toggleSelection, type CheckInDraft, type CheckInStep } from "../checkInFlowModel";
import { resolveCheckInFeeling } from "../checkInFeelingCatalog";
import { emotionCatalog } from "../emotionCatalog";

const reasonIcons = [BriefcaseBusiness, BookOpen, BatteryLow, Zap, Brain, UsersRound, House] as const;
const intensityLabels = ["moodIntensity1", "moodIntensity2", "moodIntensity3", "moodIntensity4", "moodIntensity5"] as const;
type FormStep = Extract<CheckInStep, "reasons" | "intensity">;

type CheckInReflectionFormProps = {
  step: FormStep;
  draft: CheckInDraft;
  onChange: (draft: CheckInDraft) => void;
  onSliderInteractionChange: (active: boolean) => void;
};

function StepTitle({ children }: { children: ReactNode }) {
  return <Text role="heading" aria-level={1} fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary">{children}</Text>;
}

export function CheckInReflectionForm({ step, draft, onChange, onSliderInteractionChange }: CheckInReflectionFormProps) {
  const feeling = resolveCheckInFeeling(draft.emotionId) ?? emotionCatalog.find((item) => item.id === draft.emotionId);
  const emotionName = (feeling ? getMessage("vi", feeling.labelKey) : draft.customEmotionLabel.trim()).toLowerCase();
  const update = (change: Partial<CheckInDraft>) => onChange({ ...draft, ...change });

  if (step === "reasons") {
    const title = formatMessage("vi", "moodFlowReasonsTitle", { emotion: emotionName });
    const [before, after] = title.split(emotionName);
    return <YStack width="100%" gap="$xxl">
      <StepTitle>{before}<Text color="$primary" fontWeight="$bold">{emotionName}</Text>{after}</StepTitle>
      <YStack width="100%" gap="$md" role="group" aria-label={getMessage("vi", "moodFlowReasonChoicesTitle")}>
        <Text fontFamily="$heading" fontSize="$section" lineHeight="$section" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "moodFlowReasonChoicesTitle")}</Text>
        <XStack width="100%" flexWrap="wrap" justifyContent="flex-start" gap="$sm">
          {checkInReasonOptions.map((reason, index) => {
            const Icon = reasonIcons[index];
            const selected = draft.reasonIds.includes(reason.id);
            return <AppFilterChip key={reason.id} presentation="choice" selectionMode="multiple"
              icon={<Icon size={buttonTokens.choiceIconSize} strokeWidth={2.5} color={selected ? "$white" : "$textSecondary"} aria-hidden={true} />}
              label={getMessage("vi", reason.labelKey)} selected={selected} onPress={() => update({ reasonIds: toggleSelection(draft.reasonIds, reason.id) })} />;
          })}
        </XStack>
      </YStack>
    </YStack>;
  }

  return <YStack width="100%" gap="$xxl">
    <StepTitle>{getMessage("vi", "moodFlowIntensityTitle")}</StepTitle>
    <AppSlider
      label={getMessage("vi", "moodFlowIntensitySectionTitle")}
      requirementLabel={getMessage("vi", "moodFlowRequired")}
      value={draft.intensity}
      min={1}
      max={5}
      step={1}
      minLabel={getMessage("vi", intensityLabels[0])}
      maxLabel={getMessage("vi", intensityLabels[4])}
      smooth
      showTicks={false}
      getValueLabel={(value) => {
        if (value === null) return getMessage("vi", "moodFlowSliderNotSelected");
        const rounded = Math.round(value);
        return formatMessage("vi", "moodFlowIntensityValue", { level: getMessage("vi", intensityLabels[rounded - 1]), value: rounded });
      }}
      getThumbLabel={(value) => value === null ? "" : String(Math.round(value))}
      onValueChange={(intensity) => update({ intensity })}
      onInteractionChange={onSliderInteractionChange}
    />
    <AppSlider
      label={getMessage("vi", "moodFlowSleepSectionTitle")}
      requirementLabel={getMessage("vi", "moodFlowOptional")}
      value={draft.sleepHours}
      min={2}
      max={8}
      step={1}
      minLabel={getMessage("vi", "moodFlowSleepMin")}
      maxLabel={getMessage("vi", "moodFlowSleepMax")}
      smooth
      showTicks={false}
      getValueLabel={(value) => {
        if (value === null) return getMessage("vi", "moodFlowSliderNotSelected");
        const rounded = Math.round(value);
        return rounded === 8 ? getMessage("vi", "moodFlowSleepPlusValue") : formatMessage("vi", "moodFlowSleepValue", { value: rounded });
      }}
      getThumbLabel={(value) => value === null ? "" : String(Math.round(value))}
      onValueChange={(sleepHours) => update({ sleepHours })}
      onInteractionChange={onSliderInteractionChange}
    />
  </YStack>;
}
