import { ThumbsDown, ThumbsUp } from "@tamagui/lucide-icons-2";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, ChoiceChip, SectionCard } from "../../../shared/components";
import { getMessage, type MessageKey } from "../../../shared/localization/messages";
import { negativeFeedbackReasons, type NegativeFeedbackReason } from "../types";

const reasonLabels: Record<NegativeFeedbackReason, MessageKey> = {
  wrong_tone: "feedbackWrongTone",
  too_generic: "feedbackTooGeneric",
  bad_timing: "feedbackBadTiming",
  not_our_style: "feedbackNotOurStyle",
  other: "feedbackOther",
};

type Props = {
  selectedReason: NegativeFeedbackReason | null;
  saved: boolean;
  busy: boolean;
  onReasonChange: (reason: NegativeFeedbackReason) => void;
  onRate: (value: "up" | "down", reason?: NegativeFeedbackReason) => void;
};

export function NudgeFeedbackSheet({ selectedReason, saved, busy, onReasonChange, onRate }: Props) {
  if (saved) {
    return <SectionCard tone="peach" title={getMessage("vi", "nudgeFeedbackThanks")} />;
  }
  return (
    <SectionCard title={getMessage("vi", "nudgeFeedbackTitle")}>
      <XStack gap="$sm">
        <AppButton flex={1} variant="secondary" icon={<ThumbsUp size={18} />} disabled={busy} onPress={() => onRate("up")}>
          {getMessage("vi", "nudgeHelpful")}
        </AppButton>
        <AppButton flex={1} variant="ghost" icon={<ThumbsDown size={18} />} disabled={busy || !selectedReason} onPress={() => selectedReason ? onRate("down", selectedReason) : undefined}>
          {getMessage("vi", "nudgeNotHelpful")}
        </AppButton>
      </XStack>
      <YStack gap="$sm">
        <Text fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "nudgeFeedbackReasonTitle")}</Text>
        <XStack flexWrap="wrap" gap="$sm">
          {negativeFeedbackReasons.map((reason) => (
            <ChoiceChip key={reason} label={getMessage("vi", reasonLabels[reason])} selected={selectedReason === reason} onPress={() => onReasonChange(reason)} />
          ))}
        </XStack>
      </YStack>
    </SectionCard>
  );
}
