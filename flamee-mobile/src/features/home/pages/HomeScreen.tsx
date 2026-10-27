import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { AppBlurTarget, AppScreen, UnavailableFeature, useAppHeader, type AppBlurTargetView } from "../../../shared/components";
import { memoryFeedTokens } from "../../../shared/constants/tokens";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { getMessage } from "../../../shared/localization/messages";
import { HomeMemoryList } from "../components/HomeMemoryList";
import { HomeOverlays, type HomeOverlayHandle } from "../components/HomeOverlays";
import { getMemoryFeatureMenu } from "../memoryFeatureMenu";
import { advanceHeaderScroll, type HeaderScrollState } from "../headerScrollModel";
import { localCalendarDay } from "../memoryCalendarModel";
import { useHomeMemories } from "../useHomeMemories";

type HomeScreenProps = { view?: string | string[]; checkInRequest?: string; momentRequest?: string; momentKind?: "text" | "photo" | "voice" | "signal" };

export function HomeScreen({ view: routeView, checkInRequest, momentRequest }: HomeScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const bootstrapped = useSessionStore((state) => state.isBootstrapped);
  const scope = useMemo(() => ({ accountId, coupleId, sessionId }), [accountId, coupleId, sessionId]);
  const view = getMemoryFeatureMenu(routeView).active.id;
  const screenFocused = useIsFocused();
  const [today, setToday] = useState(() => localCalendarDay(new Date()));
  const [headerCompact, setHeaderCompact] = useState(false);
  const blurTarget = useRef<AppBlurTargetView | null>(null);
  const overlays = useRef<HomeOverlayHandle | null>(null);
  const headerScroll = useRef<HeaderScrollState>({ offset: 0, travel: 0, compact: false });
  const { query, records, invalidate } = useHomeMemories(scope, bootstrapped, screenFocused);

  useFocusEffect(useCallback(() => {
    setToday(localCalendarDay(new Date()));
  }, []));
  useEffect(() => {
    headerScroll.current = { offset: 0, travel: 0, compact: false };
    setHeaderCompact(false);
  }, [view]);
  useEffect(() => {
    const timer = setInterval(() => setToday(localCalendarDay(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const next = advanceHeaderScroll(headerScroll.current, contentOffset.y, contentSize.height - layoutMeasurement.height);
    if (next.compact !== headerScroll.current.compact) setHeaderCompact(next.compact);
    headerScroll.current = next;
  }, []);
  const onAdd = useCallback(() => overlays.current?.show({ kind: "create" }), []);
  const onDetails = useCallback((id: string) => overlays.current?.show({ kind: "details", id }), []);
  const onDay = useCallback((day: string) => overlays.current?.show({ kind: "day", day }), []);
  const onConnect = useCallback(() => router.push("/connection"), [router]);
  useAppHeader({ title: getMessage("vi", getMemoryFeatureMenu(view).active.titleKey), activeMenuId: view, onAdd, compact: headerCompact }, !checkInRequest);
  const closeLegacyIntent = useCallback(() => router.setParams({ checkInRequest: undefined, momentRequest: undefined, momentKind: undefined }), [router]);
  const { refetch, fetchNextPage, isFetching, hasNextPage } = query;
  const onRefresh = useCallback(() => { void refetch({ cancelRefetch: false }); }, [refetch]);
  const onMore = useCallback(() => { if (hasNextPage && !isFetching) void fetchNextPage({ cancelRefetch: false }); }, [hasNextPage, isFetching, fetchNextPage]);
  const onPosted = useCallback(() => { void invalidate(); }, [invalidate]);
  const scopeKey = `${sessionId}:${accountId}:${coupleId}`;
  if (checkInRequest) return <UnavailableFeature title="fabEmotion" description="checkInsNotConnectedBody" showBack onBack={closeLegacyIntent} />;
  return <AppScreen scroll={false} padded={false} reserveHeaderSpace={false} safeAreaEdges={["left", "right", "bottom"]} contentProps={{ flex: 1, gap: 0 }}>
    <YStack flex={1} width="100%" maxWidth={memoryFeedTokens.maxWidth} alignSelf="center">
      <AppBlurTarget ref={blurTarget} style={{ flex: 1, width: "100%" }}>
        <HomeMemoryList key={scopeKey} records={records} view={view} today={today} topInset={insets.top}
          loading={!bootstrapped || Boolean(coupleId && query.isPending)} failed={query.isError} paired={Boolean(coupleId)} confirmed={Boolean(query.data) || (bootstrapped && !coupleId)}
          refreshing={query.isRefetching && !query.isFetchingNextPage} loadingMore={query.isFetchingNextPage} hasMore={Boolean(hasNextPage)}
          onRefresh={onRefresh} onMore={onMore} onConnect={onConnect} onAdd={onAdd} onDay={onDay} onDetails={onDetails} onScroll={onScroll} />
      </AppBlurTarget>
    </YStack>
    <HomeOverlays key={scopeKey} ref={overlays} scope={scope} records={records} focused={screenFocused} blurTarget={blurTarget} momentRequest={momentRequest} clearLegacyIntent={closeLegacyIntent} onPosted={onPosted} onRefresh={onRefresh} partial={Boolean(hasNextPage)} />
  </AppScreen>;
}
