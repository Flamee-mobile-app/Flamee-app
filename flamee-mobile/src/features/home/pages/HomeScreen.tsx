import { ArrowUpRight } from "@tamagui/lucide-icons-2/icons/ArrowUpRight";
import { BellRing } from "@tamagui/lucide-icons-2/icons/BellRing";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { MessageCircle } from "@tamagui/lucide-icons-2/icons/MessageCircle";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppHeader, AppScreen, AsyncStateView, StatusBanner } from "../../../shared/components";
import { homeShadows, homeTokens } from "../../../shared/constants/tokens";
import { localDateKey } from "../../../shared/datetime/localDate";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import {
  CheckInComposer,
  isEmotionCheckIn,
  localCheckInService,
  type EmotionCheckIn,
  type PartnerVisibleCheckIn,
} from "../../checkins";
import { localCoupleService, localPairingReminderService, type LocalPartnerSummary } from "../../couple";
import { localInviteService, type PairingNotice } from "../../invites";
import { localMomentService, MomentComposerSheet, type Moment, type MomentDraft } from "../../moments";
import { localNotificationAdapter, type NotificationSettings } from "../../notifications";
import { localNudgeService, type Nudge } from "../../nudges";
import { localOnboardingService } from "../../onboarding";
import { HomeEmotionHero } from "../components/HomeEmotionHero";
import { HomeLoadingView } from "../components/HomeLoadingView";
import { PairingNoticeModal } from "../components/PairingNoticeModal";
import { PartnerNoteCard } from "../components/PartnerNoteCard";
import { PartnerNoteSheet } from "../components/PartnerNoteSheet";
import { getNudgeHomeAction } from "../homeActionModel";
import { createPartnerNotePreview, isCurrentHomeLoad, selectHomeHero } from "../homePresentationModel";

type HomeScreenProps = {
  checkInRequest?: string;
  momentRequest?: string;
  momentKind?: MomentDraft["kind"];
};

export function HomeScreen({ checkInRequest, momentRequest, momentKind }: HomeScreenProps) {
  const router = useRouter();
  const activeAccountId = useSessionStore((session) => session.activeAccountId);
  const sessionId = useSessionStore((session) => session.sessionId);
  const setActiveCouple = useSessionStore((session) => session.setActiveCouple);
  const [loading, setLoading] = useState(true);
  const [loadedAccountId, setLoadedAccountId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partner, setPartner] = useState<LocalPartnerSummary | null>(null);
  const [latestCheckIn, setLatestCheckIn] = useState<EmotionCheckIn | null>(null);
  const [partnerCheckIn, setPartnerCheckIn] = useState<PartnerVisibleCheckIn | null>(null);
  const [selectedPartnerCheckIn, setSelectedPartnerCheckIn] = useState<PartnerVisibleCheckIn | null>(null);
  const [localNudges, setLocalNudges] = useState<Nudge[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showFabComposer, setShowFabComposer] = useState(Boolean(momentRequest));
  const [momentBusy, setMomentBusy] = useState(false);
  const [momentFeedback, setMomentFeedback] = useState<"saved" | "pending" | "failed" | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionPromptFailed, setPermissionPromptFailed] = useState(false);
  const [pendingNudgeId, setPendingNudgeId] = useState<string>();
  const [waiting, setWaiting] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [notice, setNotice] = useState<PairingNotice | null>(null);
  const requestRevision = useRef(0);

  useEffect(() => {
    requestRevision.current += 1;
    setLoading(true);
    setNotice(null);
    setShowCheckIn(false);
    setShowFabComposer(false);
    setShowPermissionPrompt(false);
    setPendingNudgeId(undefined);
    setSelectedPartnerCheckIn(null);
  }, [activeAccountId]);

  useEffect(() => {
    if (checkInRequest) setShowCheckIn(true);
  }, [checkInRequest]);

  useEffect(() => {
    if (momentRequest) {
      setMomentFeedback(null);
      setShowFabComposer(true);
    }
  }, [momentRequest]);

  const load = useCallback(async () => {
    const revision = ++requestRevision.current;
    if (!activeAccountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoadFailed(false);
    try {
      const [membership, account, checkIns, nudges, settings] = await Promise.all([
        localCoupleService.getMembership(activeAccountId),
        localOnboardingService.getAccountSnapshot(activeAccountId),
        localCheckInService.listForAccount(activeAccountId),
        localNudgeService.listForAccount(activeAccountId),
        localNotificationAdapter.getSettings(activeAccountId),
      ]);
      const [nextMoments, nextPartnerCheckIn, nextNotice] = await Promise.all([
        membership.coupleId ? localMomentService.listForCouple(membership.coupleId) : Promise.resolve([]),
        membership.status === "paired" && membership.partner ? localCheckInService.getLatestPartnerCheckIn(activeAccountId) : Promise.resolve(null),
        localInviteService.getPairingNotice(activeAccountId),
      ]);
      if (!isCurrentHomeLoad(revision, activeAccountId, requestRevision.current, useSessionStore.getState().activeAccountId)) return;

      const today = localDateKey(new Date(), account.profile.timezone);
      const currentEmotion = checkIns.find((checkIn): checkIn is EmotionCheckIn => isEmotionCheckIn(checkIn) && checkIn.localDate === today) ?? null;
      const nextCoupleId = useSessionStore.getState().activeCoupleId ?? (membership.status === "paired" ? membership.coupleId : null);
      setCoupleId(nextCoupleId);
      setActiveCouple(nextCoupleId);
      setPartner(membership.status === "paired" ? membership.partner : null);
      setProfileName(account.profile.displayName);
      setAvatarUri(account.profile.avatarUri);
      setTimezone(account.profile.timezone);
      setLatestCheckIn(currentEmotion);
      setPartnerCheckIn(nextPartnerCheckIn);
      setLocalNudges(nudges);
      setMoments(nextMoments);
      setNotificationSettings(settings);
      setWaiting(membership.status === "waiting" && Boolean(membership.inviteExpiresAt && Date.parse(membership.inviteExpiresAt) > Date.now()));
      setReminderVisible(membership.status !== "paired" && localPairingReminderService.shouldShow(activeAccountId, sessionId));
      setNotice(nextNotice);
      setLoadedAccountId(activeAccountId);
    } catch {
      if (revision === requestRevision.current) setLoadFailed(true);
    } finally {
      if (revision === requestRevision.current) setLoading(false);
    }
  }, [activeAccountId, setActiveCouple, sessionId]);

  useFocusEffect(useCallback(() => {
    void load();
    const unsubscribe = localInviteService.subscribeChanges(() => { void load(); });
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void load(); });
    return () => { requestRevision.current += 1; unsubscribe(); subscription.remove(); };
  }, [load]));

  const afterCheckIn = async (result: "saved_local" | "pending" | "error", nudgeId?: string) => {
    setShowCheckIn(false);
    router.setParams({ checkInRequest: undefined });
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

  const closeFabComposer = () => {
    setShowFabComposer(false);
    router.setParams({ momentRequest: undefined, momentKind: undefined });
  };

  const submitFabMoment = async (draft: MomentDraft) => {
    if (!activeAccountId || !coupleId) return;
    setMomentBusy(true);
    try {
      const result = await localMomentService.create(activeAccountId, coupleId, draft);
      if (result.kind !== "created") {
        setMomentFeedback("failed");
        return;
      }
      setMomentFeedback(result.moment.status === "pending" ? "pending" : result.moment.status === "failed" ? "failed" : "saved");
      if (result.moment.status !== "failed") {
        closeFabComposer();
        await load();
      }
    } catch {
      setMomentFeedback("failed");
    } finally {
      setMomentBusy(false);
    }
  };

  if (showCheckIn && loadedAccountId === activeAccountId) return (
    <CheckInComposer
      key={`${activeAccountId}-${checkInRequest ?? "home"}`}
      onClose={() => { setShowCheckIn(false); router.setParams({ checkInRequest: undefined }); }}
      onCompleted={(result, nudgeId) => { void afterCheckIn(result, nudgeId); }}
    />
  );

  if (showPermissionPrompt && loadedAccountId === activeAccountId) {
    const finish = async (allow: boolean) => {
      if (!activeAccountId || !notificationSettings) return;
      if (allow) {
        const permission = await localNotificationAdapter.requestPermissionAfterFirstCheckIn(activeAccountId);
        setNotificationSettings(permission.settings);
        if (permission.kind === "granted") {
          const reminder = await localNotificationAdapter.setDailyReminder(activeAccountId, true, permission.settings.reminderTime);
          setNotificationSettings(reminder.settings);
          setPermissionPromptFailed(reminder.kind !== "updated");
        } else setPermissionPromptFailed(permission.kind === "unavailable");
      } else setNotificationSettings(await localNotificationAdapter.dismissPermissionPrompt(activeAccountId));
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
  if (loading || (!loadFailed && loadedAccountId !== activeAccountId)) return <HomeLoadingView />;
  if (loadFailed) return <AppScreen><AsyncStateView variant="error" title="localHomeUnavailableTitle" description="localHomeUnavailableBody" actionLabel="retry" onAction={() => void load()} /></AppScreen>;
  if (showFabComposer && coupleId) return (
    <AppScreen contentProps={{ width: "100%", maxWidth: homeTokens.maxWidth, alignSelf: "center", paddingHorizontal: "$lg", paddingTop: "$lg", paddingBottom: homeTokens.navigationClearance, gap: "$lg" }}>
      <AppHeader showBack onBack={closeFabComposer} title={getMessage("vi", "homeQuickShareTitle")} subtitle={getMessage("vi", "homeQuickShareBody")} />
      {momentFeedback === "failed" ? <StatusBanner tone="warning" title={getMessage("vi", "momentCreateFailedTitle")} description={getMessage("vi", "momentCreateFailedBody")} /> : null}
      <MomentComposerSheet initialKind={momentKind} busy={momentBusy} onCancel={closeFabComposer} onSubmit={(draft) => void submitFabMoment(draft)} />
    </AppScreen>
  );

  const now = new Date();
  const heroPresentation = selectHomeHero(latestCheckIn, localNudges);
  const activeNudge = heroPresentation.kind === "nudge" ? localNudges.find((nudge) => nudge.id === heroPresentation.nudgeId) ?? null : null;
  const partnerPreview = createPartnerNotePreview(partnerCheckIn);
  const latestMoment = moments[0] ?? null;
  const today = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", timeZone: timezone }).format(now);
  const partnerName = partner?.nickname || partner?.displayName || getMessage("vi", "partnerGenericName");
  const relatedNudge = selectedPartnerCheckIn ? localNudges.find((nudge) => nudge.sourceCheckInId === selectedPartnerCheckIn.id && (nudge.status === "new" || nudge.status === "snoozed")) ?? null : null;

  const openMomentComposer = (kind?: MomentDraft["kind"], nudge?: Nudge) => router.push({
    pathname: "/(main)/moments",
    params: { composeRequest: `home-${Date.now()}`, ...(kind ? { kind } : {}), ...(nudge ? { draft: nudge.draft, nudgeId: nudge.id } : {}) },
  });
  const openNudgeAction = (nudge: Nudge) => {
    const action = getNudgeHomeAction(nudge.actionType);
    if (action.kind === "composer") openMomentComposer(action.momentKind, nudge);
    else router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId: nudge.id } });
  };
  const openPartnerNote = async () => {
    if (!partnerPreview) return;
    const detail = await localCheckInService.getByIdForAccount(activeAccountId, partnerPreview.checkInId);
    if (detail) setSelectedPartnerCheckIn(detail);
  };
  const formatMomentTime = (moment: Moment) => new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(new Date(moment.createdAt));
  const noteTime = selectedPartnerCheckIn ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "long", timeZone: timezone }).format(new Date(selectedPartnerCheckIn.createdAt)) : "";

  return (
    <AppScreen contentProps={{ width: "100%", maxWidth: homeTokens.maxWidth, alignSelf: "center", paddingHorizontal: "$lg", paddingTop: "$lg", paddingBottom: homeTokens.navigationClearance, gap: "$xl" }}>
      <XStack alignItems="center" gap="$lg" justifyContent="space-between">
        <YStack flex={1} minWidth={0} gap="$xs">
          <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{today}</Text>
          <Text role="heading" aria-level={1} fontFamily="$heading" fontSize="$h2" lineHeight="$h2" fontWeight="$bold" color="$textPrimary">
            {formatMessage("vi", "todayGreeting", { name: profileName || getMessage("vi", "defaultUserName") })}
          </Text>
        </YStack>
        <YStack width={homeTokens.avatarSize} height={homeTokens.avatarSize} backgroundColor="$surfaceMuted" borderRadius="$xl" alignItems="center" justifyContent="center" overflow="hidden" role="button" aria-label={getMessage("vi", "profileTitle")} pressStyle={{ opacity: 0.7 }} onPress={() => router.push("/(main)/profile")}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={{ width: homeTokens.avatarSize, height: homeTokens.avatarSize }} accessible={false} /> : <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textSecondary">{(profileName || getMessage("vi", "defaultUserName")).trim().charAt(0).toLocaleUpperCase("vi")}</Text>}
        </YStack>
      </XStack>

      {momentFeedback === "saved" ? <StatusBanner tone="success" title={getMessage("vi", "momentSentTitle")} description={getMessage("vi", "momentSentBody")} /> : null}
      {momentFeedback === "pending" ? <StatusBanner tone="offline" title={getMessage("vi", "momentQueuedTitle")} description={getMessage("vi", "momentQueuedBody")} /> : null}

      <HomeEmotionHero
        presentation={heroPresentation}
        nudge={activeNudge}
        onOpenComposer={() => setShowCheckIn(true)}
        onDoNudge={() => { if (activeNudge) openNudgeAction(activeNudge); }}
        onViewNudge={() => { if (activeNudge) router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId: activeNudge.id } }); }}
      />

      <PairingNoticeModal notice={notice} onClose={() => {
        if (notice) localInviteService.acknowledgePairingNotice(activeAccountId, notice.inviteId);
        setNotice(null);
      }} />

      {partner ? (
        <PartnerNoteCard partnerName={partnerName} preview={partnerPreview} onOpen={() => void openPartnerNote()} />
      ) : (
        <YStack gap="$md">
          <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "homeConnectionTitle")}</Text>
          <YStack borderRadius="$xl" backgroundColor="$surface" padding="$lg" gap="$md" {...homeShadows.card}>
            <XStack alignItems="center" justifyContent="center" gap="$md" aria-hidden={true}>
              <YStack width={34} height={34} borderRadius="$xl" backgroundColor="$secondary" opacity={0.9} />
              <Heart size={22} color="$supportCoral" />
              <YStack width={34} height={34} borderRadius="$xl" backgroundColor="$primary" opacity={0.9} />
            </XStack>
            <Text textAlign="center" fontFamily="$heading" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", waiting ? "waitingStatus" : "pairingReminderTitle")}</Text>
            <Text textAlign="center" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", waiting ? "waitingHomeBody" : "pairingReminderBody")}</Text>
            <AppButton variant="secondary" iconAfter={<ArrowUpRight size={18} />} onPress={waiting ? () => router.push("/(waiting)") : () => router.push({ pathname: "/(onboarding)", params: { start: "partner" } })}>{getMessage("vi", waiting ? "viewWaitingInvite" : "pairNow")}</AppButton>
            {!waiting && reminderVisible ? <XStack justifyContent="center" flexWrap="wrap" gap="$sm">
              <AppButton variant="ghost" onPress={() => { localPairingReminderService.snooze(activeAccountId); setReminderVisible(false); }}>{getMessage("vi", "pairingSnoozeDay")}</AppButton>
              <AppButton variant="ghost" onPress={() => { localPairingReminderService.muteSession(activeAccountId, sessionId); setReminderVisible(false); }}>{getMessage("vi", "pairingMuteSession")}</AppButton>
            </XStack> : null}
          </YStack>
        </YStack>
      )}

      {partner ? (
        <YStack gap="$md">
          <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "recentMoments")}</Text>
          {latestMoment ? (
            <YStack backgroundColor="$surface" borderRadius="$lg" padding="$lg" gap="$sm" role="button" aria-label={getMessage("vi", "viewRecentMoment")} pressStyle={{ opacity: 0.75 }} onPress={() => router.push({ pathname: "/moment/[momentId]", params: { momentId: latestMoment.id } })} {...homeShadows.card}>
              <XStack gap="$sm" alignItems="center">
                <MessageCircle size={16} color="$accentText" />
                <Text flex={1} fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{formatMessage("vi", latestMoment.authorId === activeAccountId ? "homeMomentFromYou" : "homeMomentFromPartner", { name: partnerName, time: formatMomentTime(latestMoment) })}</Text>
                <ArrowUpRight size={16} color="$textSecondary" />
              </XStack>
              <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary" numberOfLines={2}>{latestMoment.text || latestMoment.caption || getMessage("vi", latestMoment.kind === "photo" ? "photoMoment" : latestMoment.kind === "voice" ? "voiceMoment" : "momentSignal")}</Text>
            </YStack>
          ) : (
            <YStack backgroundColor="$surface" borderRadius="$lg" padding="$lg" gap="$sm" {...homeShadows.card}>
              <Text fontFamily="$heading" fontSize="$bodyL" fontWeight="$medium" color="$textPrimary">{getMessage("vi", "homeNoMomentTitle")}</Text>
              <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "homeNoMomentBody")}</Text>
            </YStack>
          )}
        </YStack>
      ) : null}

      <PartnerNoteSheet
        visible={Boolean(selectedPartnerCheckIn)}
        partnerName={partnerName}
        checkIn={selectedPartnerCheckIn}
        formattedTime={noteTime}
        hasNudge={Boolean(relatedNudge)}
        onClose={() => setSelectedPartnerCheckIn(null)}
        onDoNudge={() => { if (relatedNudge) openNudgeAction(relatedNudge); }}
      />
    </AppScreen>
  );
}
