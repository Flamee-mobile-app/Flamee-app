import { Text, YStack } from "tamagui";
import { getMessage } from "../../../shared/localization/messages";
import { AccountConnectionDetails } from "../components/AccountConnectionDetails";
import { SupportFaq } from "../components/SupportFaq";

type Mode = "data" | "support" | "account";

export function AccountLifecycleScreen({ mode }: { mode: Mode }) {
  if (mode === "account") return <AccountConnectionDetails />;
  if (mode === "support") return <SupportFaq />;
  return <YStack gap="$lg">
    <YStack gap="$xs" paddingHorizontal="$sm">
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "featureNotConnectedTitle")}</Text>
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "accountServicesUnavailableBody")}</Text>
    </YStack>
  </YStack>;
}
