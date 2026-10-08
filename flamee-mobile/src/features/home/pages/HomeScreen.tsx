import { BellRing, Heart, Plus, Sparkles } from "@tamagui/lucide-icons-2";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { CheckInComposer, localCheckInService, type PartnerVisibleCheckIn } from "../../checkins";
import { localCoupleService } from "../../couple";
import { localOnboardingService } from "../../onboarding";
import { localNotificationAdapter } from "../../notifications";
import type { NotificationSettings } from "../../notifications";
import { PartnerStatusCard, selectPartnerStatus } from "../../partner-status";
import { localNudgeService } from "../../nudges";
import type { Nudge } from "../../nudges";
import { localMomentService } from "../../moments";
import type { Moment } from "../../moments";
import { localDateKey } from "../../../shared/datetime/localDate";
import type { LocalPartnerSummary } from "../../couple";

export function HomeScreen() {
  const router = useRouter();
  const activeAccountId = useSessionStore((session) => session.activeAccountId);
  const setActiveCouple = useSessionStore((session) => session.setActiveCouple);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partner, setPartner] = useState<LocalPartnerSummary | null>(null);
  const [partnerCheckIn, setPartnerCheckIn] = useState<PartnerVisibleCheckIn | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [localNudges, setLocalNudges] = useState<Nudge[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionPromptFailed, setPermissionPromptFailed] = useState(false);
  const [pendingNudgeId, setPendingNudgeId] = useState<string>();

  const load = useCallback(async () => {
    if (!activeAccountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    try {
      const [membership, account, checkIns, nudges, settings] = await Promise.all([
        localCoupleService.getMembership(activeAccountId),
        localOnboardingService.getAccountSnapshot(activeAccountId),
        localCheckInService.listForAccount(activeAccountId),
        localNudgeService.listForAccount(activeAccountId),
        localNotificationAdapter.getSettings(activeAccountId),
      ]);
      const nextCoupleId = membership.status === "paired" ? membership.coupleId : null;
      const nextPartner = membership.status === "paired" ? membership.partner : null;
      setCoupleId(nextCoupleId);
      setActiveCouple(nextCoupleId);
      setPartner(nextPartner);
      setProfileName(account.profile.displayName);
      setTimezone(account.profile.timezone);
      setHasCheckedInToday(checkIns.some((checkIn) => localDateKey(new Date(checkIn.createdAt), account.profile.timezone) === localDateKey(new Date(), account.profile.timezone)));
      setPartnerCheckIn(nextCoupleId && nextPartner ? await localCheckInService.getLatestPartnerCheckIn(activeAccountId) : null);
      setLocalNudges(nudges);
      setMoments(nextCoupleId ? await localMomentService.listForCouple(nextCoupleId) : []);
      setNotificationSettings(settings);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, setActiveCouple]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const afterCheckIn = async (result: "saved_local" | "pending" | "error", nudgeId?: string) => {
    setShowCheckIn(false);
    if (result === "error" || !activeAccountId) return;
    setPendingNudgeId(nudgeId);
    await load();
    const settings = await localNotificationAdapter.getSettings(activeAccountId);
    setNotificationSettings(settings);
    if (settings.firstCheckInCompleted && settings.permission === "not_requested" && !settings.promptDismissed) {
      setShowPermissionPrompt(true);
    } else if (nudgeId) {
      router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId } });
    }
  };

  if (showCheckIn) return <CheckInComposer onClose={() => setShowCheckIn(false)} onCompleted={(result, nudgeId) => {
    void afterCheckIn(result, nudgeId);
  }} />;

  if (showPermissionPrompt) {
    const finish = async (allow: boolean) => {
      if (!activeAccountId || !notificationSettings) return;
      if (allow) {
        const permission = await localNotificationAdapter.requestPermissionAfterFirstCheckIn(activeAccountId);
        setNotificationSettings(permission.settings);
        if (permission.kind === "granted") {
          const reminder = await localNotificationAdapter.setDailyReminder(activeAccountId, true, permission.settings.reminderTime);
          setNotificationSettings(reminder.settings);
          setPermissionPromptFailed(reminder.kind !== "updated");
        } else {
          setPermissionPromptFailed(permission.kind === "unavailable");
        }
      } else {
        setNotificationSettings(await localNotificationAdapter.dismissPermissionPrompt(activeAccountId));
      }
      setShowPermissionPrompt(false);
      if (pendingNudgeId) router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId: pendingNudgeId } });
      setPendingNudgeId(undefined);
    };
    return (
      <AppScreen>
        <AppHeader eyebrow={getMessage("vi", "notificationValueEyebrow")} title={getMessage("vi", "notificationValueTitle")} subtitle={getMessage("vi", "notificationValueBody")} />
        {permissionPromptFailed ? <StatusBanner tone="warning" title={getMessage("vi", "notificationReminderError")} /> : null}
        <AppButton icon={<BellRing size={18} />} onPress={() => void finish(true)}>{getMessage("vi", "allowNotifications")}</AppButton>
        <AppButton variant="ghost" onPress={() => void finish(false)}>{getMessage("vi", "skipForNow")}</AppButton>
      </AppScreen>
    );
  }

  if (!activeAccountId) return <AppScreen><AsyncStateView variant="error" title="localAuthErrorTitle" description="localSessionRequiredBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  if (loading) return <AppScreen><AsyncStateView variant="loading" title="homeLoadingTitle" description="homeLoadingBody" /></AppScreen>;
  if (loadFailed) return <AppScreen><AsyncStateView variant="error" title="localHomeUnavailableTitle" description="localHomeUnavailableBody" actionLabel="retry" onAction={() => void load()} /></AppScreen>;
  if (!partner || !coupleId) return <AppScreen><AsyncStateView variant="empty" title="homeNeedPartnerTitle" description="homeNeedPartnerBody" actionLabel="createInvite" onAction={() => router.replace("/(invite)")} /></AppScreen>;

  const now = new Date();
  const partnerVisibleCheckIns = partnerCheckIn ? [partnerCheckIn] : [];
  const partnerStatus = selectPartnerStatus(partnerVisibleCheckIns, { userId: activeAccountId, timezone, partner, now });
  const activeNudge = localNudges.find((nudge) => nudge.status === "new" || nudge.status === "snoozed");
  const latestMoment = moments[0];
  const today = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", timeZone: timezone }).format(now);

  return (
    <AppScreen>
      <AppHeader
        eyebrow={today}
        title={formatMessage("vi", "todayGreeting", { name: profileName || getMessage("vi", "defaultUserName") })}
        subtitle={getMessage("vi", "todaySubtitle")}
      />
      <StatusBanner tone="info" title={getMessage("vi", "homeLocalOnlyTitle")} description={getMessage("vi", "homeLocalOnlyBody")} />
      <YStack gap="$sm">
        <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">
          {formatMessage("vi", "partnerStatusTitle", { name: partner.nickname || partner.displayName })}
        </Text>
        <PartnerStatusCard status={partnerStatus} onSignal={() => router.push("/(main)/moments")} />
      </YStack>
      {activeNudge ? (
        <SectionCard tone="lavender" title={activeNudge.observation} description={activeNudge.reason}>
          <AppButton icon={<Sparkles size={18} />} onPress={() => router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId: activeNudge.id } })}>
            {getMessage("vi", "viewNudge")}
          </AppButton>
        </SectionCard>
      ) : null}
      <SectionCard title={getMessage("vi", "yourCheckInTitle")} description={getMessage("vi", "yourCheckInBody")}>
        {hasCheckedInToday ? <StatusBanner tone="success" title={getMessage("vi", "checkInTodaySavedTitle")} description={getMessage("vi", "checkInTodaySavedBody")} /> : null}
        <AppButton icon={<Plus size={18} />} onPress={() => setShowCheckIn(true)}>{getMessage("vi", "checkInNow")}</AppButton>
      </SectionCard>
      {latestMoment ? (
        <SectionCard tone="lavender" title={getMessage("vi", "recentMoments")} description={latestMoment.text || latestMoment.caption || getMessage("vi", latestMoment.kind === "photo" ? "photoMoment" : latestMoment.kind === "voice" ? "voiceMoment" : "momentSignal")}>
          <AppButton variant="secondary" onPress={() => router.push({ pathname: "/moment/[momentId]", params: { momentId: latestMoment.id } })}>{getMessage("vi", "viewRecentMoment")}</AppButton>
        </SectionCard>
      ) : null}
      {notificationSettings?.reminderEnabled ? <StatusBanner tone="info" title={getMessage("vi", "notificationReminderEnabled")} description={formatMessage("vi", "reminderTimeLabelWithValue", { time: notificationSettings.reminderTime })} /> : null}
      <SectionCard tone="peach" title={getMessage("vi", "dailyPromptTitle")} description={getMessage("vi", "dailyPromptLocal")}>
        <XStack gap="$sm">
          <AppButton flex={1} variant="secondary" icon={<Heart size={18} />} onPress={() => router.push("/(main)/moments")}>
            {getMessage("vi", "shareAMoment")}
          </AppButton>
          <AppButton width="$control" circular variant="ghost" icon={<BellRing size={18} />} accessibilityLabel={getMessage("vi", "settingsTitle")} onPress={() => router.push("/settings")} />
        </XStack>
      </SectionCard>
    </AppScreen>
  );
}
