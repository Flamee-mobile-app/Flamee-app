import { Sparkles } from "@tamagui/lucide-icons-2/icons/Sparkles";
import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppGradientText, SectionCard } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { resolveMascotSticker } from "../../checkins";
import { moodFlowTokens } from "../../../shared/constants/tokens";

/** Unavailable presentation, never a client-generated or invented Smart Nudge. */
export function SmartNudgeCard() {
  const sticker = resolveMascotSticker("mascot-calm");
  return <SectionCard tone="white" showChevron={false} testID="moments-smart-nudge">
    <XStack alignItems="center" gap="$md">
      {sticker ? <Image source={sticker.source()} resizeMode="contain" accessible={false} style={{ width: moodFlowTokens.badgeSize, height: moodFlowTokens.badgeSize }} /> : null}
      <YStack flex={1} minWidth={0} gap="$xs">
        <XStack alignItems="center" gap="$xs"><Sparkles size={14} color="$accentText" aria-hidden={true} />
          <AppGradientText size="bodyM" weight="semibold">{getMessage("vi", "moodPreviewNudgeLabel")}</AppGradientText>
        </XStack>
        <AppGradientText size="h5" weight="bold">{getMessage("vi", "moodHomeNudgeTitle")}</AppGradientText>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "moodPreviewNudgeUnavailable")}</Text>
      </YStack>
    </XStack>
  </SectionCard>;
}
