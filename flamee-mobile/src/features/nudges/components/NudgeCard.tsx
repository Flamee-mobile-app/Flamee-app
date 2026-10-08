import { Lightbulb, MessageCircleHeart, Sparkles } from "@tamagui/lucide-icons-2";
import { Text, XStack, YStack } from "tamagui";
import { SectionCard } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import type { Nudge } from "../types";

export function NudgeCard({ nudge }: { nudge: Nudge }) {
  return (
    <YStack gap="$md">
      <SectionCard tone="lavender">
        <XStack gap="$sm" alignItems="flex-start">
          <Sparkles size={22} color="$primary" />
          <YStack flex={1} gap="$xs">
            <Text fontSize="$bodyS" color="$primary" fontWeight="$semibold">{getMessage("vi", "nudgeObservationLabel")}</Text>
            <Text fontSize="$bodyL" color="$textPrimary">{nudge.observation}</Text>
          </YStack>
        </XStack>
      </SectionCard>
      <SectionCard>
        <XStack gap="$sm" alignItems="flex-start">
          <MessageCircleHeart size={22} color="$primary" />
          <YStack flex={1} gap="$xs">
            <Text fontSize="$bodyS" color="$textSecondary" fontWeight="$semibold">{getMessage("vi", "nudgeActionLabel")}</Text>
            <Text fontSize="$bodyL" color="$textPrimary">{nudge.draft}</Text>
          </YStack>
        </XStack>
      </SectionCard>
      <XStack gap="$sm" alignItems="flex-start" paddingHorizontal="$sm">
        <Lightbulb size={18} color="$secondary" />
        <YStack flex={1} gap="$xs">
          <Text fontSize="$bodyS" color="$textSecondary" fontWeight="$semibold">{getMessage("vi", "nudgeReasonLabel")}</Text>
          <Text fontSize="$bodyS" color="$textSecondary">{nudge.reason}</Text>
        </YStack>
      </XStack>
    </YStack>
  );
}
