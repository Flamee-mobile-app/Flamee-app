import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Text, XStack, YStack } from "tamagui";
import { authService } from "../../auth";
import { connectionOptions, InviteApiError, inviteService, orderConnectedMembers } from "../../invites";
import { AppButton, AppGradientText, AppProfileAvatar, AppScreen, AppSheet, AppTextButton, SectionCard, useAppHeader } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { featureTokens, moodFlowTokens } from "../../../shared/constants/tokens";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { ServerMoodWeek, ServerPartnerMood, ServerMoodProfileBubble } from "../../checkins";
import { SmartNudgeCard } from "../../nudges";

function MoodProfileAction({ label, avatarUri, fallbackSeed, bubble, onPress, onAvatarRefresh, avatarLoading = false }: { label: string; avatarUri?: string | null; fallbackSeed?: string | null; bubble: ReactNode; onPress: () => void; onAvatarRefresh: () => void | Promise<unknown>; avatarLoading?: boolean }) {
  return <YStack flex={1} minWidth={0}>
    <AppTextButton size="compact" onPress={onPress} accessibilityLabel={label}>
      <YStack flex={1} minWidth={0} alignItems="center" gap="$sm" paddingBottom="$sm">
        <YStack height={moodFlowTokens.profileBubbleSlotHeight} alignSelf="stretch" justifyContent="flex-end">
          {bubble}
        </YStack>
        <YStack width={moodFlowTokens.profileAvatarFrameSize} height={moodFlowTokens.profileAvatarFrameSize} borderRadius={moodFlowTokens.profileAvatarFrameSize / 2}
          backgroundColor="$glassHeader" borderWidth={1} borderColor="$white" alignItems="center" justifyContent="center">
          <AppProfileAvatar uri={avatarUri} fallbackSeed={fallbackSeed} size={moodFlowTokens.profileAvatarSize} accessibilityLabel={label} onRefresh={onAvatarRefresh} loading={avatarLoading} />
        </YStack>
        <YStack height={moodFlowTokens.profileNameHeight} justifyContent="center" alignSelf="stretch">
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary" textAlign="center" numberOfLines={2}>{label}</Text>
        </YStack>
      </YStack>
    </AppTextButton>
  </YStack>;
}

export function MomentsScreen(_props: { composerRequest?: string; initialText?: string; initialKind?: "text" | "voice" | "photo" | "signal"; fromNudgeId?: string }) {
  const router = useRouter();
  useAppHeader({ title: getMessage("vi", "moodPreviewTitle") });
  const accountId = useSessionStore((session) => session.activeAccountId);
  const coupleId = useSessionStore((session) => session.activeCoupleId);
  const avatarUrl = useSessionStore((session) => session.activeAvatarUrl);
  const sessionId = useSessionStore((session) => session.sessionId);
  const bootstrapped = useSessionStore((session) => session.isBootstrapped);
  const focused = useIsFocused();
  const forceFreshAvatar = useRef(false);
  const connection = useQuery({ ...connectionOptions({ accountId, coupleId, sessionId }, inviteService.connection, () => !forceFreshAvatar.current), enabled: focused && bootstrapped && Boolean(accountId && coupleId) });
  const denied = connection.error instanceof InviteApiError && !["network", "timeout", "server", "response"].includes(connection.error.code);
  const members = !denied && connection.data?.id === coupleId && accountId ? orderConnectedMembers(connection.data, accountId) : null;
  const partner = members?.[1] ?? null;
  const [myName, setMyName] = useState(() => authService.getSessionSnapshot()?.user.full_name.trim() ?? "");
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [partnerMounted, setPartnerMounted] = useState(false);
  const myLabel = myName || getMessage("vi", "moodHomeMyAction");
  const partnerLabel = partner?.full_name.trim() || getMessage("vi", "moodHomePartnerAction");
  const refreshMyAvatar = useCallback(async () => { if (focused) await authService.refreshCurrentSession(); }, [focused]);
  const refreshPartnerAvatar = () => {
    if (!focused) return;
    forceFreshAvatar.current = true;
    return connection.refetch({ cancelRefetch: false }).finally(() => { forceFreshAvatar.current = false; });
  };
  useEffect(() => {
    if (!denied) return;
    setPartnerOpen(false); setPartnerMounted(false);
    if (focused) void authService.refreshCurrentSession().catch(() => undefined);
  }, [denied, focused]);
  useFocusEffect(useCallback(() => {
    const session = authService.getSessionSnapshot();
    setMyName(session?.accountId === accountId ? session.user.full_name.trim() : "");
  }, [accountId]));
  useFocusEffect(useCallback(() => () => { setPartnerOpen(false); setPartnerMounted(false); }, []));
  return <AppScreen contentProps={{ width: "100%", maxWidth: featureTokens.maxWidth, alignSelf: "center", paddingBottom: featureTokens.navigationClearance }}>
    <YStack gap="$xl" paddingTop="$sm">
      <YStack gap={0}>
        <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" color="$textPrimary" fontWeight="$regular">{getMessage("vi", "moodHomeQuoteLead")}</Text>
        <AppGradientText size="h3" weight="bold">{getMessage("vi", "moodHomeQuoteHighlight")}</AppGradientText>
      </YStack>
      <ServerMoodWeek onOpen={() => router.push("/mood/history")} />
      <YStack gap="$md">
        <AppGradientText size="h4" weight="bold">{getMessage("vi", "moodHomeActions")}</AppGradientText>
        <SectionCard tone="white" density="compact">
        <XStack gap="$md" alignItems="stretch">
          <MoodProfileAction label={myLabel} avatarUri={avatarUrl} fallbackSeed={accountId} bubble={<ServerMoodProfileBubble enabled={focused && bootstrapped} />} avatarLoading={!bootstrapped} onAvatarRefresh={refreshMyAvatar} onPress={() => router.push("/mood/check-in")} />
          <MoodProfileAction label={partnerLabel} avatarUri={partner?.avatar_url} fallbackSeed={partner?.id ?? "partner"} bubble={<ServerMoodProfileBubble partner available={!denied} enabled={focused && bootstrapped && !denied} />} avatarLoading={!denied && (connection.isPending || connection.isFetching) && Boolean(accountId && coupleId)} onAvatarRefresh={refreshPartnerAvatar} onPress={() => { setPartnerMounted(true); setPartnerOpen(true); }} />
        </XStack>
        </SectionCard>
      </YStack>
      <SmartNudgeCard />
    </YStack>
    {partnerMounted ? <AppSheet open={partnerOpen} fitContent disableDrag title={partnerLabel} onOpenChange={setPartnerOpen} onAfterClose={() => setPartnerMounted(false)}
      footer={<AppButton fill variant="ghost" onPress={() => setPartnerOpen(false)}>{getMessage("vi", "close")}</AppButton>}>
      <YStack alignItems="center" gap="$lg">
        <AppProfileAvatar uri={partner?.avatar_url} fallbackSeed={partner?.id ?? "partner"} size={moodFlowTokens.dashboardArtworkSize} accessibilityLabel={partnerLabel} onRefresh={refreshPartnerAvatar} />
        <ServerPartnerMood />
      </YStack>
    </AppSheet> : null}
  </AppScreen>;
}
