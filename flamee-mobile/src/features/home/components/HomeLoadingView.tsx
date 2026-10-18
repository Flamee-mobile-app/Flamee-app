import { Text, XStack, YStack } from "tamagui";
import { memoryFeedTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";

export function HomeLoadingView() {
  return (
    <YStack gap="$xl" paddingTop="$lg">
      <Text role="status" fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "homeLoadingTitle")}</Text>
      <YStack aria-hidden={true} gap="$xl">
        {[0, 1].map((key) => <YStack key={key} gap="$md">
          <XStack alignItems="center" gap="$sm">
            <YStack width={memoryFeedTokens.avatarSize} height={memoryFeedTokens.avatarSize} borderRadius="$xl" backgroundColor="$surfaceMuted" />
            <YStack gap="$xs"><YStack width={100} height={12} borderRadius="$sm" backgroundColor="$surfaceMuted" /><YStack width={60} height={8} borderRadius="$sm" backgroundColor="$surfaceMuted" /></YStack>
          </XStack>
          <YStack width="65%" height={14} borderRadius="$sm" backgroundColor="$surfaceMuted" />
          <YStack width="100%" aspectRatio={memoryFeedTokens.photoAspectRatio} borderRadius={memoryFeedTokens.photoRadius} backgroundColor="$surfaceMuted" />
        </YStack>)}
      </YStack>
    </YStack>
  );
}
