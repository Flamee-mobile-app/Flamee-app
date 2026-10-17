import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppScreen, AsyncStateView, AppButton } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { inviteIntent } from "../inviteIntent";

// External URL ingress only: remove the code from navigation once captured.
export function InviteLinkScreen() {
  const { code } = useLocalSearchParams<{ code?: string | string[] }>();
  const router = useRouter();
  const bootstrapped = useSessionStore((state) => state.isBootstrapped);
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!bootstrapped) return;
    setFailed(false);
    if (typeof code !== "string" || !inviteIntent.setCode(code)) { setFailed(true); return; }
    if (!accountId) { router.replace("/(auth)"); return; }
    router.replace("/(invite)");
  }, [bootstrapped, accountId, code, router, attempt]);
  return <AppScreen>
    <AsyncStateView variant={failed ? "error" : "loading"} title={failed ? "inviteNotFoundTitle" : "loadingTitle"} description={failed ? "inviteNotFoundBody" : "loadingDescription"} actionLabel={failed ? "retry" : undefined} onAction={failed ? () => setAttempt((value) => value + 1) : undefined} />
    {failed ? <AppButton variant="ghost" onPress={() => { inviteIntent.clear(); router.replace(accountId ? "/(main)" : "/(auth)"); }}>{getMessage("vi", "skipForNow")}</AppButton> : null}
  </AppScreen>;
}
