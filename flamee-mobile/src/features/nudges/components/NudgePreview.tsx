import { Sparkles } from "@tamagui/lucide-icons-2/icons/Sparkles";
import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppGradientText, SectionCard } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { resolveMascotSticker } from "../../checkins";
import { moodFlowTokens } from "../../../shared/constants/tokens";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused, useRouter } from "expo-router";
import { AppButton, AppSkeleton, appToast } from "../../../shared/components";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { useMoodReminderCapability } from "../../checkins";
import { dualNudgeCurrent, dualNudgeKey, dualNudgeService } from "../dualNudgeService";

/** Unavailable presentation, never a client-generated or invented Smart Nudge. */
export function SmartNudgeCard() {
  const sticker = resolveMascotSticker("mascot-calm");
  const router = useRouter();
  const focused = useIsFocused();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const revision = useSessionStore((state) => state.membershipRevision);
  const scope = { accountId, coupleId, sessionId, revision };
  const capability = useMoodReminderCapability({ accountId, sessionId });
  const query = useQuery({ queryKey: [...dualNudgeKey(scope), "active"], queryFn: ({ signal }) => dualNudgeService.active(scope, signal), enabled: Boolean(focused && accountId && coupleId && capability.data?.dual_mood_nudge), staleTime: 10_000, refetchInterval: focused ? 15_000 : false, retry: false });
  const retry = async () => {
    const feedback = appToast.operation();
    const checked = capability.data?.dual_mood_nudge ? capability : await capability.refetch();
    if (!dualNudgeCurrent(scope)) return;
    if (!checked.data?.dual_mood_nudge) { feedback.error(getMessage("vi", "moodPreviewNudgeUnavailable")); return; }
    const result = await query.refetch();
    if (!dualNudgeCurrent(scope)) return;
    if (result.isError) feedback.error(getMessage("vi", "dualNudgeError")); else feedback.success(getMessage("vi", "dualNudgeUpdated"));
  };
  if (query.data && !query.isError) return <SectionCard tone="white" emphasis="action" testID="moments-smart-nudge" accessibilityLabel={query.data.observation} onPress={() => router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId: query.data!.id } })}>
    <YStack gap="$sm"><AppGradientText size="bodyM" weight="semibold">{getMessage("vi", "moodPreviewNudgeLabel")}</AppGradientText>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{query.data.observation}</Text>
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" numberOfLines={2}>{query.data.draft}</Text>
    </YStack>
  </SectionCard>;
  return <SectionCard tone="white" showChevron={false} testID="moments-smart-nudge">
    <XStack alignItems="center" gap="$md">
      {sticker ? <Image source={sticker.source()} resizeMode="contain" accessible={false} style={{ width: moodFlowTokens.badgeSize, height: moodFlowTokens.badgeSize }} /> : null}
      <YStack flex={1} minWidth={0} gap="$xs">
        <XStack alignItems="center" gap="$xs"><Sparkles size={14} color="$accentText" aria-hidden={true} />
          <AppGradientText size="bodyM" weight="semibold">{getMessage("vi", "moodPreviewNudgeLabel")}</AppGradientText>
        </XStack>
        <AppGradientText size="h5" weight="bold">{getMessage("vi", "moodHomeNudgeTitle")}</AppGradientText>
        {capability.isPending && accountId || capability.data?.dual_mood_nudge && query.isPending && coupleId ? <AppSkeleton height={18} width="100%" />
          : <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", capability.isError || query.isError ? "dualNudgeError" : capability.data?.dual_mood_nudge && coupleId ? "dualNudgeEmpty" : "moodPreviewNudgeUnavailable")}</Text>}
        {capability.isError || query.isError ? <AppButton variant="ghost" onPress={() => { void retry(); }}>{getMessage("vi", "retry")}</AppButton> : null}
      </YStack>
    </XStack>
  </SectionCard>;
}
