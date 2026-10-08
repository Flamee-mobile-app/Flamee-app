import { MessageCircle, Trash2 } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Button, Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppHeader, AppScreen, AsyncStateView, SectionCard, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { localCoupleService } from "../../couple";
import { localOnboardingService } from "../../onboarding";
import { MomentCard } from "../components/MomentCard";
import { MomentComposerSheet } from "../components/MomentComposerSheet";
import { localMomentService } from "../localMomentService";
import { momentReactions, type Moment, type MomentDraft } from "../types";

export function MomentDetailScreen({ momentId }: { momentId: string }) {
  const router = useRouter();
  const accountId = useSessionStore((session) => session.activeAccountId);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [viewerTimezone, setViewerTimezone] = useState("Asia/Ho_Chi_Minh");
  const [partnerName, setPartnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);

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
      setViewerTimezone(account.profile.timezone);
      setPartnerName(membership.partner?.nickname || membership.partner?.displayName || "");
      setMoments(membership.status === "paired" && membership.coupleId ? await localMomentService.listForCouple(membership.coupleId) : []);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { void load(); }, [load]);

  const moment = moments.find((item) => item.id === momentId);
  const replies = moments.filter((item) => item.parentMomentId === momentId);

  if (loading) return <AppScreen><AsyncStateView variant="loading" title="momentsLoadingTitle" description="momentsLoadingBody" /></AppScreen>;
  if (loadFailed) return <AppScreen><AsyncStateView variant="error" title="localMomentUnavailableTitle" description="localMomentUnavailableBody" actionLabel="retry" onAction={() => void load()} /></AppScreen>;
  if (!moment) return <AppScreen><AsyncStateView variant="empty" title="momentDeletedTitle" description="momentDeletedBody" actionLabel="back" onAction={router.back} /></AppScreen>;
  const own = moment.authorId === accountId;
  const reply = async (draft: MomentDraft) => {
    setBusy(true);
    try {
      const result = await localMomentService.reply(moment.id, accountId ?? "", draft);
      if (result.kind === "created") {
        setMoments(await localMomentService.listForCouple(moment.coupleId));
        setReplying(false);
      } else setActionFailed(true);
    } catch {
      setActionFailed(true);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      const deleted = await localMomentService.delete(moment.id, accountId ?? "");
      if (deleted) router.back();
      else setActionFailed(true);
    } catch {
      setActionFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen>
      <AppHeader showBack title={getMessage("vi", "momentTitle")} />
      <StatusBanner tone="info" title={getMessage("vi", "momentLocalOnlyTitle")} description={getMessage("vi", "momentLocalOnlyBody")} />
      {actionFailed ? <StatusBanner tone="warning" title={getMessage("vi", "momentActionFailedTitle")} description={getMessage("vi", "momentActionFailedBody")} /> : null}
      <MomentCard moment={moment} own={own} partnerName={partnerName} viewerTimezone={viewerTimezone} onOpen={() => undefined} onRetry={() => void localMomentService.retry(moment.id).then(() => load())} />
      <SectionCard title={getMessage("vi", "reactTitle")} description={getMessage("vi", "reactBody")}>
        <XStack flexWrap="wrap" gap="$sm">
          {momentReactions.map((emoji) => (
            <Button key={emoji} circular size="$control" backgroundColor="$supportPeachLight" borderColor="$border" borderWidth={1} fontSize={22} onPress={() => void localMomentService.react(moment.id, accountId ?? "", emoji).then((result) => { if (result.kind === "updated") setMoments((items) => items.map((item) => item.id === moment.id ? result.moment : item)); else setActionFailed(true); })}>{emoji}</Button>
          ))}
        </XStack>
      </SectionCard>
      {replying ? <MomentComposerSheet busy={busy} onCancel={() => setReplying(false)} onSubmit={reply} /> : <AppButton variant="secondary" icon={<MessageCircle size={18} />} onPress={() => setReplying(true)}>{getMessage("vi", "replyMoment")}</AppButton>}
      {replies.length ? (
        <YStack gap="$sm">
          <Text fontFamily="$heading" fontSize="$h5" color="$textPrimary">{getMessage("vi", "repliesTitle")}</Text>
          {replies.map((item) => <MomentCard key={item.id} moment={item} own={item.authorId === accountId} partnerName={partnerName} viewerTimezone={viewerTimezone} onOpen={() => router.push({ pathname: "/moment/[momentId]", params: { momentId: item.id } })} />)}
        </YStack>
      ) : null}
      {own ? (
        deleteConfirm ? (
          <SectionCard title={getMessage("vi", "deleteMomentConfirmTitle")} description={getMessage("vi", "deleteMomentConfirmBody")}>
            <XStack gap="$sm"><AppButton flex={1} variant="ghost" onPress={() => setDeleteConfirm(false)}>{getMessage("vi", "cancel")}</AppButton><AppButton flex={1} variant="destructive" disabled={busy} onPress={remove}>{getMessage("vi", "deleteForever")}</AppButton></XStack>
          </SectionCard>
        ) : <AppButton variant="ghost" icon={<Trash2 size={18} />} onPress={() => setDeleteConfirm(true)}>{getMessage("vi", "deleteMoment")}</AppButton>
      ) : null}
    </AppScreen>
  );
}
