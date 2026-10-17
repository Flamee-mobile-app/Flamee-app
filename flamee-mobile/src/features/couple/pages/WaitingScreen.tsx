import { Clock3 } from "@tamagui/lucide-icons-2/icons/Clock3";
import { Send } from "@tamagui/lucide-icons-2/icons/Send";
import { Redirect, useRouter } from "expo-router";
import { AppState, Share } from "react-native";
import { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AppButton, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { inviteService, invitationURL, type ServerInvite } from "../../invites";
import { authService } from "../../auth/authRuntime";

export function WaitingScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const activeCoupleId = useSessionStore((state) => state.activeCoupleId);
  const setActiveCouple = useSessionStore((state) => state.setActiveCouple);
  const [shareFailed, setShareFailed] = useState(false);
  const [invite, setInvite] = useState<ServerInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = async (showLoading = true) => {
    if (!accountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    if (showLoading) setLoading(true);
    setLoadFailed(false);
    try {
      const currentInvite = await inviteService.current();
      if (useSessionStore.getState().activeAccountId !== accountId) return;
      setInvite(currentInvite);
      if (currentInvite?.status === "accepted") {
        const session = await authService.refreshCurrentSession();
        if (session?.user.couple_id) setActiveCouple(session.user.couple_id);
      }
    } catch {
      setLoadFailed(true);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = setInterval(() => { if (AppState.currentState === "active") void load(false); }, 5_000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void load(false); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [accountId]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const shareInvite = async () => {
    try {
      if (!invite) return;
      await Share.share({ message: `${getMessage("vi", "inviteShareMessage")} ${invite.code}\n${invitationURL(invite.code)}` });
      setShareFailed(false);
    } catch {
      setShareFailed(true);
    }
  };

  const homeButton = <AppButton variant="ghost" onPress={() => router.replace("/(main)")}>{getMessage("vi", "continueHome")}</AppButton>;

  if (!accountId) return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  if (loading) return <AppScreen><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></AppScreen>;
  if (loadFailed) return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => void load()} />{homeButton}</AppScreen>;
  if (activeCoupleId) return <Redirect href="/(main)" />;

  const expired = Boolean(invite && (invite.status === "expired" || Date.parse(invite.expires_at) <= now));
  if (expired) {
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "waitingTitle")} />
        <AsyncStateView
          variant="expired"
          title="inviteExpiredTitle"
          description="inviteExpiredBody"
          actionLabel="resendInvite"
          onAction={async () => {
            if (!accountId) return;
            try {
              const nextInvite = await inviteService.create();
              setInvite(nextInvite);
            } catch {
              setLoadFailed(true);
            }
          }}
        />
        {homeButton}
      </AppScreen>
    );
  }

  if (!invite || invite.status !== "pending") {
    return <AppScreen><AppHeader title={getMessage("vi", "waitingTitle")} /><AsyncStateView variant="empty" title="inviteNotFoundTitle" description="inviteNotFoundBody" actionLabel="createInvite" onAction={() => router.replace("/(invite)")} />{homeButton}</AppScreen>;
  }

  const hoursRemaining = Math.max(1, Math.ceil((Date.parse(invite.expires_at) - now) / (60 * 60 * 1000)));
  const expiryCopy = hoursRemaining <= 6 ? "waitingTimeExpiring" : "waitingTimeLeft";

  return (
    <AppScreen>
      <AppHeader eyebrow={getMessage("vi", "waitingEyebrow")} title={getMessage("vi", "waitingTitle")} subtitle={getMessage("vi", "waitingBody")} />
      <SectionCard tone="peach">
        <XStack alignItems="center" gap="$md">
          <YStack width={54} height={54} borderRadius="$lg" alignItems="center" justifyContent="center" backgroundColor="$surface">
            <Clock3 size={26} color="$primary" />
          </YStack>
          <YStack flex={1} gap="$xs">
            <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold">{getMessage("vi", "waitingStatus")}</Text>
            <Text color="$textSecondary">{formatMessage("vi", expiryCopy, { hours: hoursRemaining })}</Text>
          </YStack>
          <Text letterSpacing={2} fontWeight="$bold">{invite.code}</Text>
        </XStack>
      </SectionCard>
      <AppButton
        icon={<Send size={18} />}
        onPress={() => void shareInvite()}
      >
        {getMessage("vi", "shareInvite")}
      </AppButton>
      {shareFailed ? <StatusBanner tone="warning" title={getMessage("vi", "shareInviteError")} /> : null}
      {homeButton}
    </AppScreen>
  );
}
