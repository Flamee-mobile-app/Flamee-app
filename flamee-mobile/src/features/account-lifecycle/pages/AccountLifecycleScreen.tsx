import { LogOut } from "@tamagui/lucide-icons-2/icons/LogOut";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Text, YStack } from "tamagui";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AppButton, SectionCard, appToast } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { authService } from "../../auth";
import { inviteIntent } from "../../invites";
import { localNotificationAdapter } from "../../notifications";

type Mode = "data" | "support" | "account";

export function AccountLifecycleScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const signOut = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true);
    const accountId = useSessionStore.getState().activeAccountId;
    try {
      await authService.signOut();
      inviteIntent.clear();
      queryClient.clear();
      useSessionStore.getState().reset();
      // Actual native temporary resources; never pretend this deletes server data.
      if (accountId) await localNotificationAdapter.clearAccount(accountId).catch(() => undefined);
      router.replace("/(auth)");
    } catch { appToast.error(getMessage("vi", "accountLoadError")); }
    finally { pending.current = false; setBusy(false); }
  };
  return <YStack gap="$lg">
    {mode === "account" ? <SectionCard title={getMessage("vi", "signOutTitle")} description={getMessage("vi", "signOutBody")}>
      <AppButton variant="secondary" icon={<LogOut size={18} />} loading={busy} disabled={busy} onPress={() => void signOut()}>{getMessage("vi", "signOutAction")}</AppButton>
    </SectionCard> : null}
    <YStack gap="$xs" paddingHorizontal="$sm">
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "featureNotConnectedTitle")}</Text>
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "accountServicesUnavailableBody")}</Text>
    </YStack>
  </YStack>;
}
