import { Text, XStack, YStack } from "tamagui";
import { AppSkeleton, AppSkeletonGroup } from "../../../shared/components";
import { memoryFeedTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";

export function HomeLoadingView() {
  return (
    <YStack gap="$xl" paddingTop="$lg">
      <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "homeLoadingTitle")}</Text>
      <AppSkeletonGroup accessibilityLabel={getMessage("vi", "homeLoadingTitle")}>
        <YStack gap="$xl">
        {[0, 1].map((key) => <YStack key={key} gap="$md">
          <XStack alignItems="center" gap="$sm">
            <AppSkeleton width={memoryFeedTokens.avatarSize} height={memoryFeedTokens.avatarSize} borderRadius={memoryFeedTokens.avatarSize / 2} />
            <YStack gap="$xs"><AppSkeleton width={100} height={12} /><AppSkeleton width={60} height={8} /></YStack>
          </XStack>
          <AppSkeleton width="65%" height={14} />
          <AppSkeleton width="100%" aspectRatio={memoryFeedTokens.photoAspectRatio} borderRadius={memoryFeedTokens.photoRadius} />
        </YStack>)}
        </YStack>
      </AppSkeletonGroup>
    </YStack>
  );
}
