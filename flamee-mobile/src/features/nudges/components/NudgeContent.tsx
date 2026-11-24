import { Text, YStack } from "tamagui";
import { AppThoughtBubble } from "../../../shared/components";
import { nudgeTokens } from "../../../shared/constants/tokens";
import type { DualNudge } from "../dualNudgeApi";
import { NudgeArtwork, nudgeActionTitle } from "./NudgeArtwork";

export function NudgeContent({ nudge }: { nudge: DualNudge }) {
  return <YStack gap="$lg" paddingVertical="$sm">
    <YStack alignItems="center" gap="$sm">
      <NudgeArtwork nudge={nudge} size={nudgeTokens.detailArtworkSize} />
      <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary" textAlign="center">{nudgeActionTitle(nudge)}</Text>
    </YStack>
    <AppThoughtBubble showTail={false}>
      <YStack padding="$xs">
        <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" color="$textPrimary" textAlign="center">{nudge.draft}</Text>
      </YStack>
    </AppThoughtBubble>
  </YStack>;
}
