import { Plus, Sparkles } from "@tamagui/lucide-icons-2";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";
import { Text, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { localCoupleService } from "../../couple";
import { localOnboardingService } from "../../onboarding";
import { localNudgeService, NudgeFeedbackSheet, type Nudge, type NegativeFeedbackReason } from "../../nudges";
import { localMomentService } from "../localMomentService";
import type { Moment, MomentDraft } from "../types";
import { MomentCard } from "../components/MomentCard";
import { MomentComposerSheet } from "../components/MomentComposerSheet";

type Props = { initialText?: string; initialKind?: MomentDraft["kind"]; fromNudgeId?: string };

export function MomentsScreen({ initialText = "", initialKind, fromNudgeId }: Props) {
  const router = useRouter();
  const accountId = useSessionStore((session) => session.activeAccountId);
  const setActiveCouple = useSessionStore((session) => session.setActiveCouple);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [viewerTimezone, setViewerTimezone] = useState("Asia/Ho_Chi_Minh");
  const [partnerName, setPartnerName] = useState("");
  const [moments, setMoments] = useState<Moment[]>([]);
  const [composerOpen, setComposerOpen] = useState(Boolean(initialText || fromNudgeId));
  const [busy, setBusy] = useState(false);
  const [submissionState, setSubmissionState] = useState<"saved" | "pending" | "failed" | null>(null);
  const [feedbackNudge, setFeedbackNudge] = useState<Nudge | null>(null);
  const [nudgeActionFailed, setNudgeActionFailed] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState<NegativeFeedbackReason | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    try {
      const [membership, account] = await Promise.all([
        localCoupleService.getMembership(accountId),
        localOnboardingService.getAccountSnapshot(accountId),
      ]);
      const nextCoupleId = membership.status === "paired" ? membership.coupleId : null;
      setCoupleId(nextCoupleId);
      setActiveCouple(nextCoupleId);
      setViewerTimezone(account.profile.timezone);
      setPartnerName(membership.partner?.nickname || membership.partner?.displayName || "");
      setMoments(nextCoupleId ? await localMomentService.listForCouple(nextCoupleId) : []);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [accountId, setActiveCouple]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const refresh = async () => {
    setRefreshing(true);
    try {
      if (coupleId) setMoments(await localMomentService.listForCouple(coupleId));
    } catch {
      setLoadFailed(true);
    } finally {
      setRefreshing(false);
    }
  };

  const completeNudgeAction = async (moment: Moment) => {
    if (!moment.fromNudgeId || moment.status === "failed") return;
    try {
      const result = await localNudgeService.act(moment.fromNudgeId, { momentId: moment.id, draft: moment.text ?? moment.caption ?? initialText });
      if (result.kind === "updated") setFeedbackNudge(result.nudge);
      else setNudgeActionFailed(true);
    } catch {
      setNudgeActionFailed(true);
    }
  };

  const retryMoment = async (momentId: string) => {
    const retried = await localMomentService.retry(momentId);
    if (retried.kind === "created") {
      setMoments(await localMomentService.listForCouple(retried.moment.coupleId));
      setSubmissionState(retried.moment.status === "pending" ? "pending" : retried.moment.status === "failed" ? "failed" : "saved");
      if (retried.moment.status !== "failed") await completeNudgeAction(retried.moment);
    }
  };

  const submit = async (draft: MomentDraft) => {
    if (!accountId || !coupleId) return;
    setBusy(true);
    try {
      const result = await localMomentService.create(accountId, coupleId, draft, { nudgeId: fromNudgeId });
      if (result.kind !== "created") {
        setSubmissionState("failed");
        return;
      }
      const moment = result.moment;
      setMoments(await localMomentService.listForCouple(coupleId));
      setComposerOpen(false);
      setSubmissionState(moment.status === "pending" ? "pending" : moment.status === "failed" ? "failed" : "saved");
      if (moment.status !== "failed") await completeNudgeAction(moment);
      router.setParams({ draft: undefined, nudgeId: undefined, kind: undefined });
    } catch {
      setSubmissionState("failed");
    } finally {
      setBusy(false);
    }
  };

  const rateNudge = async (value: "up" | "down", reason?: NegativeFeedbackReason) => {
    if (!feedbackNudge) return;
    setBusy(true);
    try {
      const result = await localNudgeService.rate(feedbackNudge.id, value, reason);
      if (result.kind === "updated") setFeedbackNudge(result.nudge);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}>
      <AppHeader eyebrow={getMessage("vi", "momentsEyebrow")} title={getMessage("vi", "momentsTitle")} subtitle={getMessage("vi", "momentsSubtitle")} />
      {loading ? <AsyncStateView variant="loading" title="momentsLoadingTitle" description="momentsLoadingBody" /> : null}
      {loadFailed ? <AsyncStateView variant="error" title="localMomentUnavailableTitle" description="localMomentUnavailableBody" actionLabel="retry" onAction={() => void load()} /> : null}
      {!loading && !loadFailed && !coupleId ? <AsyncStateView variant="empty" title="momentsNeedPartnerTitle" description="momentsNeedPartnerBody" actionLabel="createInvite" onAction={() => router.push("/(invite)")} /> : null}
      <StatusBanner tone="info" title={getMessage("vi", "momentLocalOnlyTitle")} description={getMessage("vi", "momentLocalOnlyBody")} />
      {submissionState === "saved" ? <StatusBanner tone="success" title={getMessage("vi", "momentSentTitle")} description={getMessage("vi", "momentSentBody")} /> : null}
      {submissionState === "pending" ? <StatusBanner tone="offline" title={getMessage("vi", "momentQueuedTitle")} description={getMessage("vi", "momentQueuedBody")} /> : null}
      {submissionState === "failed" ? <StatusBanner tone="warning" title={getMessage("vi", "momentCreateFailedTitle")} description={getMessage("vi", "momentCreateFailedBody")} /> : null}
      {nudgeActionFailed ? <StatusBanner tone="warning" title={getMessage("vi", "nudgeActionErrorTitle")} description={getMessage("vi", "nudgeActionErrorBody")} /> : null}
      {feedbackNudge ? (
        <NudgeFeedbackSheet selectedReason={feedbackReason} saved={Boolean(feedbackNudge.feedback)} busy={busy} onReasonChange={setFeedbackReason} onRate={(value, reason) => void rateNudge(value, reason)} />
      ) : null}
      <SectionCard tone="lavender" title={getMessage("vi", "dailyPromptTitle")} description={getMessage("vi", "dailyPromptLocal")}>
        {!composerOpen ? <AppButton variant="secondary" icon={<Sparkles size={18} />} onPress={() => setComposerOpen(true)}>{getMessage("vi", "answerPrompt")}</AppButton> : null}
      </SectionCard>
      {composerOpen ? <MomentComposerSheet initialText={initialText} initialKind={initialKind} busy={busy} onCancel={() => setComposerOpen(false)} onSubmit={submit} /> : (
        <AppButton icon={<Plus size={18} />} onPress={() => setComposerOpen(true)}>{getMessage("vi", "createMoment")}</AppButton>
      )}
      {!loading && !loadFailed && moments.length === 0 ? (
        <AsyncStateView variant="empty" title="momentsEmptyTitle" description="momentsEmptyBody" actionLabel="createMoment" onAction={() => setComposerOpen(true)} />
      ) : !loading && !loadFailed ? (
        <YStack gap="$md">
          <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "recentMoments")}</Text>
          {moments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              own={moment.authorId === accountId}
              partnerName={partnerName}
              viewerTimezone={viewerTimezone}
              onOpen={() => router.push({ pathname: "/moment/[momentId]", params: { momentId: moment.id } })}
              onRetry={() => void retryMoment(moment.id)}
            />
          ))}
        </YStack>
      ) : null}
    </AppScreen>
  );
}
