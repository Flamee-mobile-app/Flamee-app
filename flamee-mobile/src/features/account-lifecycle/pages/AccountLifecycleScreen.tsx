import { Text, YStack } from "tamagui";
import { useRouter } from "expo-router";
import { AppButton } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { SignOutAction } from "../components/SignOutAction";

type Mode = "data" | "support" | "account";

export function AccountLifecycleScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  return <YStack gap="$lg">
    {mode === "account" ? <><AppButton fill variant="secondary" onPress={() => router.push({ pathname: "/settings", params: { section: "password" } })}>{getMessage("vi", "passwordChangeTitle")}</AppButton><SignOutAction /></> : null}
    <YStack gap="$xs" paddingHorizontal="$sm">
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "featureNotConnectedTitle")}</Text>
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "accountServicesUnavailableBody")}</Text>
    </YStack>
  </YStack>;
}
