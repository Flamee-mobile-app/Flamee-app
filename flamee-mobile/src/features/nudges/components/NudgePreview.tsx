import { Sparkles } from "@tamagui/lucide-icons-2/icons/Sparkles";
import { ArrowUpRight } from "@tamagui/lucide-icons-2/icons/ArrowUpRight";
import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppGradientText, SectionCard } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { resolveMascotSticker } from "../../checkins";
import { moodFlowTokens, nudgeTokens } from "../../../shared/constants/tokens";
import { NudgeArtwork, nudgeActionTitle } from "./NudgeArtwork";
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
  const query = useQuery({ queryKey: [...dualNudgeKey(scope), "active"], queryFn: ({ signal }) => dualNudgeService.active(scope, signal), enabled: Boolean(focused && accountId && coupleId && capability.data?.dual_mood_nudge), staleTime: 30_000, refetchInterval: false, refetchOnReconnect: false, retry: false });
  const retry = async () => {
    const feedback = appToast.operation();
    const checked = capability.data?.dual_mood_nudge ? capability : await capability.refetch();
    if (!dualNudgeCurrent(scope)) return;
    if (!checked.data?.dual_mood_nudge) { feedback.error(getMessage("vi", "moodPreviewNudgeUnavailable")); return; }
    const result = await query.refetch();
    if (!dualNudgeCurrent(scope)) return;
    if (result.isError) feedback.error(getMessage("vi", "dualNudgeError")); else feedback.success(getMessage("vi", "dualNudgeUpdated"));
  };
  if (query.data && !query.isError) return <SectionCard tone="white" emphasis="action" showChevron={false} testID="moments-smart-nudge" accessibilityLabel={`${getMessage("vi", "moodPreviewNudgeLabel")}. ${nudgeActionTitle(query.data)}`} onPress={() => router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId: query.data!.id } })}>
    <YStack gap="$md">
      <XStack alignItems="center" gap="$xs"><Sparkles size={nudgeTokens.iconSize} color="$accentText" aria-hidden />
        <AppGradientText size="label" weight="semibold">{getMessage("vi", "moodPreviewNudgeLabel")}</AppGradientText>
      </XStack>
      <XStack gap="$md" alignItems="center">
        <YStack flex={1} minWidth={0} gap="$sm">
          <Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">{nudgeActionTitle(query.data)}</Text>
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" numberOfLines={2}>{query.data.observation}</Text>
        </YStack>
        <NudgeArtwork nudge={query.data} size={nudgeTokens.previewArtworkSize} />
      </XStack>
      <XStack alignItems="center" gap="$xs">
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$accentText">{getMessage("vi", "nudgeVisualOpen")}</Text>
        <ArrowUpRight size={nudgeTokens.iconSize} color="$accentText" aria-hidden />
      </XStack>
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
