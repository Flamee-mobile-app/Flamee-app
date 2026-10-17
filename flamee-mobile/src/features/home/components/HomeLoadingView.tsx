import { Text, XStack, YStack } from "tamagui";
import { AppScreen } from "../../../shared/components";
import { homeTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";

export function HomeLoadingView() {
  return (
    <AppScreen contentProps={{ width: "100%", maxWidth: homeTokens.maxWidth, alignSelf: "center", paddingHorizontal: "$lg", paddingTop: "$lg", paddingBottom: homeTokens.navigationClearance, gap: "$xl" }}>
      <Text role="status" fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "homeLoadingTitle")}</Text>
      <YStack aria-hidden={true} gap="$xl">
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap="$sm"><YStack width={100} height={12} borderRadius="$sm" backgroundColor="$surfaceMuted" /><YStack width={190} height={32} borderRadius="$sm" backgroundColor="$surfaceMuted" /></YStack>
          <YStack width={homeTokens.avatarSize} height={homeTokens.avatarSize} borderRadius="$xl" backgroundColor="$surfaceMuted" />
        </XStack>
        <YStack height={220} borderRadius="$xl" backgroundColor="$calmSurface" />
        <YStack height={132} borderRadius="$xl" backgroundColor="$accentSoft" />
        <YStack height={112} borderRadius="$xl" backgroundColor="$surface" />
      </YStack>
    </AppScreen>
  );
}
