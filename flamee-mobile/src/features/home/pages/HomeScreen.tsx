import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, RefreshControl } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppIconButton, AppScreen, AsyncStateView, SectionCard, UnavailableFeature } from "../../../shared/components";
import { homeTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { authService, type AuthSession } from "../../auth";
import { HomeLoadingView } from "../components/HomeLoadingView";
import { HomeEmotionHero } from "../components/HomeEmotionHero";

type HomeScreenProps = { checkInRequest?: string; momentRequest?: string; momentKind?: "text" | "photo" | "voice" | "signal" };

export function HomeScreen({ checkInRequest, momentRequest }: HomeScreenProps) {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [profile, setProfile] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const revision = useRef(0);
  const load = useCallback(async () => {
    const request = ++revision.current;
    setLoading(true); setFailed(false); setProfile(null);
    try {
      const session = await authService.refreshCurrentSession();
      if (request !== revision.current || useSessionStore.getState().activeAccountId !== accountId) return;
      if (!session || session.accountId !== accountId) throw new Error("Session unavailable");
      setProfile(session);
      useSessionStore.getState().setActiveCouple(session.user.couple_id ?? null);
    } catch { if (request === revision.current) setFailed(true); }
    finally { if (request === revision.current) setLoading(false); }
  }, [accountId]);
  useFocusEffect(useCallback(() => { void load(); return () => { revision.current += 1; }; }, [load]));
  const closeUnavailable = () => router.setParams({ checkInRequest: undefined, momentRequest: undefined, momentKind: undefined });
  if (checkInRequest) return <UnavailableFeature title="fabEmotion" description="checkInsNotConnectedBody" showBack onBack={closeUnavailable} />;
  if (momentRequest) return <UnavailableFeature title="momentsTitle" description="timelineNotConnectedBody" showBack onBack={closeUnavailable} />;
  if (loading) return <HomeLoadingView />;
  if (failed || profile?.accountId !== accountId) return <AppScreen><AsyncStateView variant="error" actionLabel="retry" onAction={() => void load()} /></AppScreen>;
  const name = profile.user.username || profile.user.full_name;
  const today = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return <AppScreen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />} contentProps={{ width: "100%", maxWidth: homeTokens.maxWidth, alignSelf: "center", paddingHorizontal: "$lg", paddingTop: "$lg", paddingBottom: homeTokens.navigationClearance, gap: "$xl" }}>
    <XStack alignItems="center" gap="$lg" justifyContent="space-between">
      <YStack flex={1} minWidth={0} gap="$xs">
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{today}</Text>
        <Text role="heading" aria-level={1} fontFamily="$heading" fontSize="$h2" lineHeight="$h2" fontWeight="$bold" color="$textPrimary">{formatMessage("vi", "todayGreeting", { name })}</Text>
      </YStack>
      <AppIconButton accessibilityLabel={getMessage("vi", "profileTitle")} onPress={() => router.push("/(main)/profile")} icon={<YStack width="100%" height="100%" borderRadius="$md" alignItems="center" justifyContent="center" overflow="hidden" backgroundColor="$surfaceMuted">
        {profile.user.avatar_url ? <Image source={{ uri: profile.user.avatar_url }} style={{ width: homeTokens.avatarSize, height: homeTokens.avatarSize }} accessible={false} /> : <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textSecondary">{name.trim().charAt(0).toLocaleUpperCase("vi")}</Text>}
      </YStack>} />
    </XStack>
    <HomeEmotionHero presentation={{ kind: "empty" }} nudge={null} unavailable />
    <SectionCard title={getMessage("vi", "homeConnectionTitle")} description={getMessage("vi", profile.user.couple_id ? "connectionPairedTitle" : "connectionEmptyBody")}>
      <AppButton variant="secondary" onPress={() => router.push("/connection")}>{getMessage("vi", "fabConnection")}</AppButton>
    </SectionCard>
    <SectionCard title={getMessage("vi", "timelineTitle")} description={getMessage("vi", "timelineNotConnectedBody")} />
  </AppScreen>;
}
