import { HeartHandshake } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { Text, YStack } from "tamagui";
import { AppButton, AppScreen, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";

export function PairedSuccess() {
  const router = useRouter();
  return (
    <AppScreen scroll={false} contentProps={{ justifyContent: "center", alignItems: "center", paddingBottom: "$xxl" }}>
      <Text fontFamily="$body" fontSize="$bodyS" fontWeight="$semibold" color="$primary">
        {getMessage("vi", "pairedSuccessEyebrow")}
      </Text>
      <YStack width={104} height={104} borderRadius="$xl" backgroundColor="$supportPeachLight" alignItems="center" justifyContent="center">
        <HeartHandshake size={54} color="$primary" />
      </YStack>
      <Text textAlign="center" fontFamily="$heading" fontSize="$h1" lineHeight="$h1" fontWeight="$bold" color="$textPrimary">
        {getMessage("vi", "pairedSuccessTitle")}
      </Text>
      <Text textAlign="center" fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" color="$textSecondary">
        {getMessage("vi", "pairedSuccessBody")}
      </Text>
      <StatusBanner tone="info" title={getMessage("vi", "inviteLocalOnlyTitle")} description={getMessage("vi", "inviteLocalOnlyBody")} />
      <AppButton alignSelf="stretch" onPress={() => router.replace("/(main)")}>
        {getMessage("vi", "enterHome")}
      </AppButton>
    </AppScreen>
  );
}
