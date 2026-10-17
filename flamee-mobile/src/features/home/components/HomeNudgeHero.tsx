import { ArrowUpRight } from "@tamagui/lucide-icons-2/icons/ArrowUpRight";
import { Sparkles } from "@tamagui/lucide-icons-2/icons/Sparkles";
import { Text, XStack, YStack } from "tamagui";
import { AppButton } from "../../../shared/components";
import { homeShadows } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import type { Nudge } from "../../nudges";

export function HomeNudgeHero({ nudge, onDoNow, onViewDetails }: { nudge: Nudge; onDoNow: () => void; onViewDetails: () => void }) {
  return (
    <YStack backgroundColor="$calmSurface" borderRadius="$xl" padding="$lg" gap="$lg" {...homeShadows.hero}>
      <XStack alignItems="center" gap="$sm">
        <YStack width={36} height={36} borderRadius="$md" backgroundColor="$surface" alignItems="center" justifyContent="center">
          <Sparkles size={18} color="$calmText" />
        </YStack>
        <YStack flex={1} minWidth={0} gap="$xs">
          <Text fontFamily="$body" fontSize="$bodyS" fontWeight="$semibold" color="$calmText">
            {getMessage("vi", "homeSuggestionTitle")}
          </Text>
          <Text fontFamily="$body" fontSize="$caption" color="$textSecondary">
            {getMessage("vi", "homeNudgeReady")}
          </Text>
        </YStack>
      </XStack>
      <YStack gap="$sm">
        <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary">
          {nudge.observation}
        </Text>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">
          {nudge.reason}
        </Text>
      </YStack>
      {nudge.draft ? (
        <YStack backgroundColor="$surface" borderRadius="$lg" padding="$md" gap="$xs">
          <Text fontFamily="$body" fontSize="$caption" color="$calmText">{getMessage("vi", "nudgeDraftLabel")}</Text>
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary" numberOfLines={3}>“{nudge.draft}”</Text>
        </YStack>
      ) : null}
      <XStack alignItems="center" gap="$sm">
        <AppButton iconAfter={<ArrowUpRight size={18} />} onPress={onDoNow}>{getMessage("vi", "nudgeDoNow")}</AppButton>
        <AppButton variant="ghost" onPress={onViewDetails}>
          {getMessage("vi", "homeNudgeDetails")}
        </AppButton>
      </XStack>
    </YStack>
  );
}
