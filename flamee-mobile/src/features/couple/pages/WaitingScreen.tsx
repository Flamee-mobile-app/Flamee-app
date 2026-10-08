import { Clock3, Gift, Send } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { Share } from "react-native";
import { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { CheckInComposer } from "../../checkins";
import { localInviteService, type LocalInvite } from "../../invites";
import { localOnboardingService } from "../../onboarding";
import { localNotificationAdapter } from "../../notifications";
import { localCoupleService, type CoupleMembership, type LocalPartnerSummary } from "../localCoupleService";
import { PairedSuccess } from "../components/PairedSuccess";

export function WaitingScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const setActiveCouple = useSessionStore((state) => state.setActiveCouple);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationPromptFailed, setNotificationPromptFailed] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const [invite, setInvite] = useState<LocalInvite | null>(null);
  const [membership, setMembership] = useState<CoupleMembership | null>(null);
  const [profile, setProfile] = useState<LocalPartnerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = async () => {
    if (!accountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    try {
      const [currentInvite, currentMembership, account] = await Promise.all([
        localInviteService.getOpenInvite(accountId),
        localCoupleService.getMembership(accountId),
        localOnboardingService.getAccountSnapshot(accountId),
      ]);
      setInvite(currentInvite);
      setMembership(currentMembership);
      setProfile({
        id: accountId,
        displayName: account.profile.displayName,
        nickname: account.profile.partnerNickname,
        avatarUri: account.profile.avatarUri,
        timezone: account.profile.timezone,
      });
      if (currentMembership.status === "paired") setActiveCouple(currentMembership.coupleId);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [accountId]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const shareInvite = async () => {
    try {
      if (!invite) return;
      await Share.share({ message: `${getMessage("vi", "inviteShareMessage")} ${invite.code}` });
      setShareFailed(false);
    } catch {
      setShareFailed(true);
    }
  };

  if (showCheckIn) return <CheckInComposer onClose={() => setShowCheckIn(false)} onCompleted={(result) => {
    if (result === "error" || !accountId) return;
    void localNotificationAdapter.getSettings(accountId).then((settings) => {
      if (settings.firstCheckInCompleted && settings.permission === "not_requested" && !settings.promptDismissed) setShowNotificationPrompt(true);
    });
  }} />;

  if (showNotificationPrompt) {
    const finish = async (allow: boolean) => {
      if (!accountId) return;
      if (allow) {
        const permission = await localNotificationAdapter.requestPermissionAfterFirstCheckIn(accountId);
        if (permission.kind === "granted") {
          const reminder = await localNotificationAdapter.setDailyReminder(accountId, true, permission.settings.reminderTime);
          setNotificationPromptFailed(reminder.kind !== "updated");
        } else setNotificationPromptFailed(permission.kind === "unavailable");
      } else {
        await localNotificationAdapter.dismissPermissionPrompt(accountId);
      }
      setShowNotificationPrompt(false);
    };
    return (
      <AppScreen>
        <AppHeader eyebrow={getMessage("vi", "notificationValueEyebrow")} title={getMessage("vi", "notificationValueTitle")} subtitle={getMessage("vi", "notificationValueBody")} />
        {notificationPromptFailed ? <StatusBanner tone="warning" title={getMessage("vi", "notificationReminderError")} /> : null}
        <AppButton onPress={() => void finish(true)}>{getMessage("vi", "allowNotifications")}</AppButton>
        <AppButton variant="ghost" onPress={() => void finish(false)}>{getMessage("vi", "skipForNow")}</AppButton>
      </AppScreen>
    );
  }

  if (!accountId) return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  if (loading) return <AppScreen><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></AppScreen>;
  if (loadFailed) return <AppScreen><AsyncStateView variant="error" title="localInviteUnavailableTitle" description="localInviteUnavailableBody" actionLabel="retry" onAction={() => void load()} /></AppScreen>;
  if (membership?.status === "paired") return <PairedSuccess />;

  const expired = Boolean(membership?.inviteExpiresAt && Date.parse(membership.inviteExpiresAt) <= now);
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
            if (!accountId || !profile) return;
            try {
              const nextInvite = await localInviteService.createInvite(accountId, profile);
              setInvite(nextInvite);
              setMembership(await localCoupleService.getMembership(accountId));
            } catch {
              setLoadFailed(true);
            }
          }}
        />
      </AppScreen>
    );
  }

  if (!invite || membership?.status !== "waiting") {
    return <AppScreen><AppHeader title={getMessage("vi", "waitingTitle")} /><AsyncStateView variant="empty" title="inviteNotFoundTitle" description="inviteNotFoundBody" actionLabel="createInvite" onAction={() => router.replace("/(invite)")} /></AppScreen>;
  }

  const hoursRemaining = Math.max(1, Math.ceil((Date.parse(invite.expiresAt) - now) / (60 * 60 * 1000)));
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
      {invite.gift ? (
        <StatusBanner tone="success" title={getMessage("vi", "giftWaiting")} />
      ) : (
        <StatusBanner tone="info" title={getMessage("vi", "noGiftWaiting")} />
      )}
      <AppButton
        icon={<Send size={18} />}
        onPress={() => void shareInvite()}
      >
        {getMessage("vi", "shareInvite")}
      </AppButton>
      {shareFailed ? <StatusBanner tone="warning" title={getMessage("vi", "shareInviteError")} /> : null}
      <AppButton variant="secondary" onPress={() => setShowCheckIn(true)}>
        {getMessage("vi", "firstCheckIn")}
      </AppButton>
      <AppButton variant="secondary" icon={<Gift size={18} />} onPress={() => router.push("/(invite)")}>
        {getMessage("vi", "giftTitle")}
      </AppButton>
      <SectionCard tone="lavender" description={getMessage("vi", "reminderTimeline")} />
      <StatusBanner tone="info" title={getMessage("vi", "inviteLocalOnlyTitle")} description={getMessage("vi", "inviteLocalOnlyBody")} />
    </AppScreen>
  );
}
