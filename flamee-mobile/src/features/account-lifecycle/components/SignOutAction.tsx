import { LogOut } from "@tamagui/lucide-icons-2/icons/LogOut";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { XStack } from "tamagui";
import { AppButton, AppDialog, SectionCard, appToast } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { authService } from "../../auth";
import { inviteIntent } from "../../invites";
import { localNotificationAdapter } from "../../notifications";
import { performLocalSignOut } from "../localSignOut";

export function SignOutAction() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  const signOut = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    const accountId = useSessionStore.getState().activeAccountId;
    try {
      const result = await performLocalSignOut({
        signOut: authService.signOut,
        clearInvite: () => inviteIntent.clear(),
        clearQueries: () => queryClient.clear(),
        replaceAuth: () => router.replace("/(auth)"),
        // Actual native temporary resources; never pretend this deletes server data.
        clearNative: async () => { if (accountId) await localNotificationAdapter.clearAccount(accountId); },
      });
      if (result.kind === "localOnly" && useSessionStore.getState().activeAccountId === null) appToast.info(getMessage("vi", "signOutLocalOnly"));
    } catch {
      appToast.error(getMessage("vi", "accountLoadError"));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return <>
    <SectionCard title={getMessage("vi", "signOutTitle")} description={getMessage("vi", "signOutBody")}>
      <AppButton variant="secondary" icon={<LogOut size={18} />} disabled={busy} onPress={() => setConfirming(true)}>
        {getMessage("vi", "signOutAction")}
      </AppButton>
    </SectionCard>
    <AppDialog open={confirming} onOpenChange={setConfirming} dismissible={!busy}
      title={getMessage("vi", "signOutTitle")} description={getMessage("vi", "signOutBody")}>
      <XStack gap="$sm">
        <AppButton grow variant="ghost" disabled={busy} onPress={() => setConfirming(false)}>{getMessage("vi", "cancel")}</AppButton>
        <AppButton grow variant="destructive" loading={busy} disabled={busy} onPress={() => void signOut()}>{getMessage("vi", "signOutAction")}</AppButton>
      </XStack>
    </AppDialog>
  </>;
}
