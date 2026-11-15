import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import { YStack } from "tamagui";
import { AppBlurTarget, AppGradientPlusIcon, AppIconButton, AppScreen, UnavailableFeature, type AppBlurTargetView } from "../../../shared/components";
import { memoryFeedTokens, spacing } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { getBottomNavigationLayout } from "../../../shared/navigation/bottomNavigationModel";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { HomeMemoryList } from "../components/HomeMemoryList";
import { HomeOverlays, type HomeOverlayHandle } from "../components/HomeOverlays";
import { getMemoryFeatureMenu } from "../memoryFeatureMenu";
import { localCalendarDay } from "../memoryCalendarModel";
import { useHomeMemories } from "../useHomeMemories";

type HomeScreenProps = { view?: string | string[]; checkInRequest?: string; momentRequest?: string; momentKind?: "text" | "photo" | "voice" | "signal" };

export function HomeScreen({ view: routeView, checkInRequest, momentRequest }: HomeScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigationLayout = getBottomNavigationLayout(width, insets.bottom);
  // AppScreen already applies the bottom safe area; the nav overlays the window.
  const addBottom = navigationLayout.bottomInset + navigationLayout.barHeight + spacing.lg - insets.bottom;
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const bootstrapped = useSessionStore((state) => state.isBootstrapped);
  const scope = useMemo(() => ({ accountId, coupleId, sessionId }), [accountId, coupleId, sessionId]);
  const view = getMemoryFeatureMenu(routeView).active.id;
  const screenFocused = useIsFocused();
  const [today, setToday] = useState(() => localCalendarDay(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const refreshPending = useRef(false);
  const blurTarget = useRef<AppBlurTargetView | null>(null);
  const overlays = useRef<HomeOverlayHandle | null>(null);
  const { query, records, invalidate, refresh } = useHomeMemories(scope, bootstrapped, screenFocused);

  useFocusEffect(useCallback(() => {
    setToday(localCalendarDay(new Date()));
  }, []));
  useEffect(() => {
    const timer = setInterval(() => setToday(localCalendarDay(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);
  const onAdd = useCallback(() => overlays.current?.show({ kind: "create" }), []);
  const onDetails = useCallback((id: string) => overlays.current?.show({ kind: "details", id }), []);
  const onComments = useCallback((id: string) => overlays.current?.show({ kind: "comments", id }), []);
  const onDay = useCallback((day: string) => overlays.current?.show({ kind: "day", day }), []);
  const onConnect = useCallback(() => router.push("/connection"), [router]);
  const closeLegacyIntent = useCallback(() => router.setParams({ checkInRequest: undefined, momentRequest: undefined, momentKind: undefined }), [router]);
  const { fetchNextPage, isFetching, hasNextPage } = query;
  const onRefresh = useCallback(() => {
    if (refreshPending.current) return;
    refreshPending.current = true;
    setRefreshing(true);
    const finish = () => {
      refreshPending.current = false;
      setRefreshing(false);
    };
    void refresh().then(finish, finish);
  }, [refresh]);
  const onMore = useCallback(() => { if (hasNextPage && !isFetching) void fetchNextPage({ cancelRefetch: false }); }, [hasNextPage, isFetching, fetchNextPage]);
  const onPosted = useCallback(() => { void invalidate(); }, [invalidate]);
  const scopeKey = `${sessionId}:${accountId}:${coupleId}`;
  if (checkInRequest) return <UnavailableFeature title="fabEmotion" description="checkInsNotConnectedBody" showBack onBack={closeLegacyIntent} />;
  return <AppScreen scroll={false} padded={false} reserveHeaderSpace={false} safeAreaEdges={["left", "right", "bottom"]} contentProps={{ flex: 1, gap: 0 }}>
    <YStack flex={1} width="100%" maxWidth={memoryFeedTokens.maxWidth} alignSelf="center">
      <AppBlurTarget ref={blurTarget} style={{ flex: 1, width: "100%" }}>
        <HomeMemoryList key={scopeKey} records={records} view={view} today={today} topInset={insets.top}
          loading={!bootstrapped || Boolean(coupleId && query.isPending)} failed={query.isError} paired={Boolean(coupleId)} confirmed={Boolean(query.data) || (bootstrapped && !coupleId)}
          refreshing={refreshing} loadingMore={query.isFetchingNextPage} hasMore={Boolean(hasNextPage)}
          onRefresh={onRefresh} onMore={onMore} onConnect={onConnect} onAdd={onAdd} onDay={onDay} onDetails={onDetails} onComments={onComments} />
      </AppBlurTarget>
    </YStack>
    {screenFocused && bootstrapped && accountId && coupleId ? <YStack position="absolute" right={spacing.page} bottom={addBottom}>
      <AppIconButton testID="home-add-memory-floating" tone="floating" accessibilityLabel={getMessage("vi", "memoryFeedAdd")} icon={<AppGradientPlusIcon />} onPress={onAdd} />
    </YStack> : null}
    <HomeOverlays key={scopeKey} ref={overlays} scope={scope} records={records} focused={screenFocused} blurTarget={blurTarget} momentRequest={momentRequest} clearLegacyIntent={closeLegacyIntent} onPosted={onPosted} onRefresh={onRefresh} partial={Boolean(hasNextPage)} />
  </AppScreen>;
}
