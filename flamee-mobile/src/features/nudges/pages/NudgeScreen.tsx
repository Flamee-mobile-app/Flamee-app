import { Clock3, Pencil, Send, X } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, AppField, AppHeader, AppScreen, AsyncStateView, StatusBanner } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { localNudgeService } from "../localNudgeService";
import { NudgeCard } from "../components/NudgeCard";
import { NudgeFeedbackSheet } from "../components/NudgeFeedbackSheet";
import type { NegativeFeedbackReason, Nudge, NudgeMutationResult } from "../types";

export function NudgeScreen({ nudgeId }: { nudgeId: string }) {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mutationFailed, setMutationFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState<NegativeFeedbackReason | null>(null);

  const load = async () => {
    if (!accountId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    setNudge(null);
    try {
      const found = await localNudgeService.getForAccount(accountId, nudgeId);
      setNudge(found);
      if (found) setDraft(found.draft);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [accountId, nudgeId]);

  if (!accountId) return <AppScreen><AsyncStateView variant="error" title="nudgeNotFoundTitle" description="nudgeNotFoundBody" actionLabel="retry" onAction={() => router.replace("/(auth)")} /></AppScreen>;
  if (loading) return <AppScreen><AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /></AppScreen>;
  if (loadFailed) return <AppScreen><AsyncStateView variant="error" title="localNudgeUnavailableTitle" description="localNudgeUnavailableBody" actionLabel="retry" onAction={() => void load()} /></AppScreen>;
  if (!nudge) return <AppScreen><AsyncStateView variant="error" title="nudgeNotFoundTitle" description="nudgeNotFoundBody" actionLabel="backToHome" onAction={() => router.replace("/(main)")} /></AppScreen>;
  if (nudge.status === "expired") return <AppScreen><AppHeader showBack title={getMessage("vi", "nudgeTitle")} /><AsyncStateView variant="expired" title="nudgeExpiredTitle" description="nudgeExpiredBody" actionLabel="backToHome" onAction={() => router.replace("/(main)")} /></AppScreen>;

  const handled = nudge.status === "acted" || nudge.status === "skipped";
  const run = async (action: () => Promise<NudgeMutationResult>) => {
    if (busy) return;
    setBusy(true);
    setMutationFailed(false);
    try {
      const result = await action();
      if (result.kind === "updated") setNudge(result.nudge);
      else setMutationFailed(true);
    } catch {
      setMutationFailed(true);
    } finally {
      setBusy(false);
    }
  };
  const doNow = () => {
    const kind = nudge.actionType === "voice" || nudge.actionType === "photo" ? nudge.actionType : "text";
    router.push({ pathname: "/(main)/moments", params: { nudgeId: nudge.id, draft, kind } });
  };

  return (
    <AppScreen>
      <AppHeader showBack eyebrow={getMessage("vi", "nudgeEyebrow")} title={getMessage("vi", "nudgeTitle")} />
      {nudge.source === "template" ? <StatusBanner tone="info" title={getMessage("vi", "nudgeFallbackTitle")} description={getMessage("vi", "nudgeFallbackBody")} /> : null}
      {nudge.tone === "crisis_safe" ? <StatusBanner tone="warning" title={getMessage("vi", "nudgeCrisisTitle")} description={getMessage("vi", "nudgeCrisisBody")} /> : null}
      {nudge.status === "snoozed" ? <StatusBanner tone="info" title={getMessage("vi", "nudgeSnoozedTitle")} description={getMessage("vi", "nudgeSnoozedBody")} /> : null}
      {mutationFailed ? <StatusBanner tone="warning" title={getMessage("vi", "nudgeActionErrorTitle")} description={getMessage("vi", "nudgeActionErrorBody")} /> : null}
      {handled ? (
        <StatusBanner tone="success" title={nudge.status === "acted" ? getMessage("vi", "nudgeActedTitle") : getMessage("vi", "nudgeSkippedTitle")} description={getMessage("vi", "nudgeHandledBody")} />
      ) : null}
      <NudgeCard nudge={{ ...nudge, draft }} />
      {!handled ? (
        <YStack gap="$md">
          {editing ? <AppField multiline label={getMessage("vi", "nudgeDraftLabel")} value={draft} onChangeText={setDraft} maxLength={280} characterCount={`${draft.length}/280`} /> : null}
          <AppButton icon={<Send size={18} />} disabled={busy || !draft.trim()} onPress={doNow}>{getMessage("vi", "nudgeDoNow")}</AppButton>
          <AppButton variant="secondary" icon={<Pencil size={18} />} disabled={busy} onPress={() => setEditing((value) => !value)}>{getMessage("vi", "nudgeEditDraft")}</AppButton>
          <XStack gap="$sm">
            <AppButton flex={1} variant="ghost" icon={<Clock3 size={18} />} disabled={busy || nudge.snoozeCount >= 1} onPress={() => run(() => localNudgeService.snooze(nudge.id))}>{getMessage("vi", "nudgeLater")}</AppButton>
            <AppButton flex={1} variant="ghost" icon={<X size={18} />} disabled={busy} onPress={() => run(() => localNudgeService.skip(nudge.id))}>{getMessage("vi", "nudgeSkip")}</AppButton>
          </XStack>
        </YStack>
      ) : (
        <NudgeFeedbackSheet selectedReason={feedbackReason} saved={Boolean(nudge.feedback)} busy={busy} onReasonChange={setFeedbackReason} onRate={(value, reason) => run(() => localNudgeService.rate(nudge.id, value, reason))} />
      )}
    </AppScreen>
  );
}

export function NudgeSupportUnavailableScreen() {
  const router = useRouter();
  return <AppScreen><StatusBanner tone="warning" title={getMessage("vi", "nudgeSupportUnavailableTitle")} description={getMessage("vi", "nudgeSupportUnavailableBody")} /><AppButton onPress={() => router.replace("/(main)")}>{getMessage("vi", "backToHome")}</AppButton></AppScreen>;
}
