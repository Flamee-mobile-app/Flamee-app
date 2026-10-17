import { ArrowUpRight } from "@tamagui/lucide-icons-2/icons/ArrowUpRight";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Sparkles } from "@tamagui/lucide-icons-2/icons/Sparkles";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, SectionCard } from "../../../shared/components";
import { homeShadows } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import type { Nudge } from "../../nudges";
import type { HomeHeroPresentation } from "../homePresentationModel";

type HomeEmotionHeroProps = {
  presentation: HomeHeroPresentation;
  nudge: Nudge | null;
  onOpenComposer: () => void;
  onDoNudge: () => void;
  onViewNudge: () => void;
};

export function HomeEmotionHero({ presentation, nudge, onOpenComposer, onDoNudge, onViewNudge }: HomeEmotionHeroProps) {
  const showingNudge = presentation.kind === "nudge" && nudge;
  return (
    <YStack
      backgroundColor={showingNudge ? "$calmSurface" : "$accentSoft"}
      borderRadius="$xl"
      padding="$lg"
      gap="$lg"
      {...homeShadows.hero}
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$sm">
        <XStack alignItems="center" gap="$sm">
          <YStack width={36} height={36} borderRadius="$md" backgroundColor="$surface" alignItems="center" justifyContent="center">
            {showingNudge ? <Sparkles size={18} color="$calmText" /> : presentation.kind === "saved" ? <Check size={18} color="$accentText" /> : <YStack width={9} height={9} borderRadius="$sm" backgroundColor="$primary" />}
          </YStack>
          <Text fontFamily="$body" fontSize="$bodyS" fontWeight="$semibold" color={showingNudge ? "$calmText" : "$accentText"}>
            {getMessage("vi", showingNudge ? "homeSuggestionTitle" : "homeEmotionEyebrow")}
          </Text>
        </XStack>
      </XStack>

      {showingNudge ? (
        <>
          <YStack gap="$sm">
            <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary">
              {nudge.observation}
            </Text>
            <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{nudge.reason}</Text>
          </YStack>
          {nudge.draft ? (
            <SectionCard>
              <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary" numberOfLines={2}>“{nudge.draft}”</Text>
            </SectionCard>
          ) : null}
          <XStack alignItems="center" gap="$sm" flexWrap="wrap">
            <AppButton iconAfter={<ArrowUpRight size={18} />} onPress={onDoNudge}>
              {getMessage("vi", "nudgeDoNow")}
            </AppButton>
            <AppButton variant="ghost" onPress={onViewNudge}>
              {getMessage("vi", "homeNudgeDetails")}
            </AppButton>
          </XStack>
        </>
      ) : (
        <>
          <YStack gap="$sm">
            <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary">
              {getMessage("vi", "homeCheckInQuestion")}
            </Text>
            {presentation.kind === "saved" ? (
              <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary" numberOfLines={2}>“{presentation.note}”</Text>
            ) : (
              <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", "homeCheckInDescription")}</Text>
            )}
          </YStack>
          <AppButton iconAfter={<ArrowUpRight size={18} />} onPress={onOpenComposer}>
            {getMessage("vi", presentation.kind === "saved" ? "homeCheckInQuestion" : "emotionSend")}
          </AppButton>
        </>
      )}
    </YStack>
  );
}
