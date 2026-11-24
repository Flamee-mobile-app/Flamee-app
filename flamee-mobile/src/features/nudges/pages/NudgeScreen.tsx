import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, XStack, YStack } from "tamagui";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Clock3 } from "@tamagui/lucide-icons-2/icons/Clock3";
import { AppButton, AppSkeleton, FeatureScreen, UnavailableFeature, appToast } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { useMoodReminderCapability } from "../../checkins";
import { dualNudgeCurrent, dualNudgeKey, dualNudgeService } from "../dualNudgeService";
import type { NudgeAction } from "../dualNudgeApi";
import { NudgeContent } from "../components/NudgeContent";
import { nudgeTokens } from "../../../shared/constants/tokens";

export function NudgeScreen({ nudgeId }: { nudgeId: string }) {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const revision = useSessionStore((state) => state.membershipRevision);
  const scope = { accountId, coupleId, sessionId, revision };
  const client = useQueryClient();
  const capability = useMoodReminderCapability({ accountId, sessionId });
  const key = [...dualNudgeKey(scope), "detail", nudgeId];
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => dualNudgeService.detail(scope, nudgeId, signal), enabled: Boolean(nudgeId && accountId && coupleId && capability.data?.dual_mood_nudge), retry: false });
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    const feedback = appToast.operation();
    const checked = capability.data?.dual_mood_nudge ? capability : await capability.refetch();
    if (!dualNudgeCurrent(scope)) return;
    if (!checked.data?.dual_mood_nudge) { feedback.error(getMessage("vi", "moodPreviewNudgeUnavailable")); return; }
    const result = await query.refetch();
    if (!dualNudgeCurrent(scope)) return;
    if (result.isError) feedback.error(getMessage("vi", "dualNudgeError")); else feedback.success(getMessage("vi", "dualNudgeUpdated"));
  };
  const act = async (action: NudgeAction) => {
    if (pending.current || !query.data || !dualNudgeCurrent(scope)) return;
    pending.current = true; setBusy(true);
    const feedback = appToast.operation(); feedback.loading(getMessage("vi", "dualNudgeSaving"));
    try {
      const result = await dualNudgeService.act(scope, nudgeId, action, query.data.version);
      if (!dualNudgeCurrent(scope)) return;
      client.setQueryData(key, result);
      void client.invalidateQueries({ queryKey: dualNudgeKey(scope) });
      feedback.success(getMessage("vi", "dualNudgeSaved"));
    } catch { if (dualNudgeCurrent(scope)) { feedback.error(getMessage("vi", "dualNudgeFailed")); void client.invalidateQueries({ queryKey: dualNudgeKey(scope) }); } }
    finally { feedback.dismiss(); pending.current = false; if (dualNudgeCurrent(scope)) setBusy(false); }
  };
  return <FeatureScreen title={getMessage("vi", "moodPreviewNudgeLabel")} showBack withBottomNavigation={false}>
    {capability.isPending || (capability.data?.dual_mood_nudge && query.isPending) ? <AppSkeleton height={120} />
      : !capability.data?.dual_mood_nudge || query.isError || !query.data ? <YStack gap="$md"><Text fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "dualNudgeError")}</Text><AppButton variant="ghost" onPress={() => { void retry(); }}>{getMessage("vi", "retry")}</AppButton></YStack>
      : <YStack gap="$lg">
        <NudgeContent key={query.data.id} nudge={query.data} />
        {query.data.status === "new" && !(query.data.snoozed_until && Date.parse(query.data.snoozed_until) > Date.now()) ? <YStack gap="$sm">
          <AppButton fill depth="subtle" icon={<Check size={nudgeTokens.iconSize} color="$white" />} disabled={busy} loading={busy} onPress={() => { void act("completed"); }}>{getMessage("vi", "dualNudgeDone")}</AppButton>
          <XStack gap="$sm">
            {query.data.snooze_count === 0 ? <AppButton grow depth="flat" variant="secondary" icon={<Clock3 size={nudgeTokens.iconSize} color="$accentText" />} disabled={busy} onPress={() => { void act("snoozed"); }}>{getMessage("vi", "dualNudgeSnooze")}</AppButton> : null}
            <AppButton grow depth="flat" variant="ghost" disabled={busy} onPress={() => { void act("dismissed"); }}>{getMessage("vi", "dualNudgeDismiss")}</AppButton>
          </XStack>
        </YStack> : <XStack alignItems="center" justifyContent="center" gap="$sm" paddingVertical="$md" aria-live="polite">
          {query.data.status === "completed" ? <Check size={nudgeTokens.iconSize} color="$calmText" aria-hidden /> : null}
          <Text flexShrink={1} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="center">{getMessage("vi", query.data.status === "completed" ? "nudgeStatusCompleted" : query.data.status === "dismissed" ? "nudgeStatusDismissed" : query.data.status === "expired" ? "nudgeStatusExpired" : "nudgeStatusSnoozed")}</Text>
        </XStack>}
      </YStack>}
  </FeatureScreen>;
}

export function NudgeSupportUnavailableScreen() {
  return <UnavailableFeature title="supportSettingsTitle" showBack />;
}
