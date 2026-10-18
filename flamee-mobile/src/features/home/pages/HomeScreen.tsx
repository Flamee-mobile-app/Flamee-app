import { ImagePlus } from "@tamagui/lucide-icons-2/icons/ImagePlus";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { AppBlurTarget, AppButton, AppScreen, AppSheet, AsyncStateView, UnavailableFeature, type AppBlurTargetView } from "../../../shared/components";
import { memoryFeedTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { authService } from "../../auth";
import { memoryService, type MemorySummary } from "../../moments";
import { HomeLoadingView } from "../components/HomeLoadingView";
import { MemoryFeedPost, MemoryGalleryTile } from "../components/MemoryFeedPost";
import { MemoryComposerDialog } from "../components/MemoryComposerDialog";
import { MemoryFeedHeader } from "../components/MemoryFeedHeader";
import { formatMemoryDate, selectMemoryFeed, type MemoryFeedView } from "../memoryFeedModel";

type HomeScreenProps = { checkInRequest?: string; momentRequest?: string; momentKind?: "text" | "photo" | "voice" | "signal" };
type FeedSnapshot = { accountId: string; coupleId: string | null; records: MemorySummary[] };
type Panel = "create" | "notifications" | "details" | null;

export function HomeScreen({ checkInRequest, momentRequest }: HomeScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<MemoryFeedView>("timeline");
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [width, setWidth] = useState(320);
  const [headerHidden, setHeaderHidden] = useState(false);
  const revision = useRef(0);
  const blurTarget = useRef<AppBlurTargetView | null>(null);
  const lastScrollOffset = useRef(0);
  const directionalTravel = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const request = ++revision.current;
    if (refresh) setRefreshing(true);
    else { setLoading(true); setSnapshot(null); }
    setFailed(false);
    const current = () => request === revision.current && useSessionStore.getState().activeAccountId === accountId;
    try {
      const session = await authService.refreshCurrentSession();
      if (!current()) return;
      if (!session || session.accountId !== accountId) throw new Error("Session unavailable");
      const serverCoupleId = session.user.couple_id ?? null;
      useSessionStore.getState().setActiveCouple(serverCoupleId);
      if (!serverCoupleId) {
        setSnapshot({ accountId: session.accountId, coupleId: null, records: [] });
        return;
      }
      const result = await memoryService.list();
      if (!current() || useSessionStore.getState().activeCoupleId !== serverCoupleId) return;
      setSnapshot({ accountId: session.accountId, coupleId: serverCoupleId, records: result.items });
    } catch {
      if (current()) { setFailed(true); setSnapshot(null); }
    } finally {
      if (request === revision.current) { setLoading(false); setRefreshing(false); }
    }
  }, [accountId]);

  useFocusEffect(useCallback(() => {
    setPanel(null); setSelectedId(null);
    void load();
    return () => { revision.current += 1; };
  }, [load]));

  useEffect(() => {
    lastScrollOffset.current = 0;
    directionalTravel.current = 0;
    setHeaderHidden(false);
  }, [view]);

  const handleFeedScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = offset - lastScrollOffset.current;
    if (offset <= 8) {
      directionalTravel.current = 0;
      setHeaderHidden(false);
    } else if (Math.abs(delta) >= 1) {
      const changedDirection = Math.sign(delta) !== Math.sign(directionalTravel.current);
      directionalTravel.current = changedDirection ? delta : directionalTravel.current + delta;
      if (directionalTravel.current >= 18) {
        setHeaderHidden(true);
        directionalTravel.current = 0;
      } else if (directionalTravel.current <= -12) {
        setHeaderHidden(false);
        directionalTravel.current = 0;
      }
    }
    lastScrollOffset.current = offset;
  }, []);

  const scoped = snapshot?.accountId === accountId && snapshot.coupleId === coupleId ? snapshot : null;
  const records = useMemo(() => selectMemoryFeed(scoped?.records ?? [], view), [scoped, view]);
  const selected = scoped?.records.find((record) => record.id === selectedId);
  const closeLegacyIntent = () => router.setParams({ checkInRequest: undefined, momentRequest: undefined, momentKind: undefined });
  if (checkInRequest) return <UnavailableFeature title="fabEmotion" description="checkInsNotConnectedBody" showBack onBack={closeLegacyIntent} />;
  const panelOpen = panel !== null || Boolean(momentRequest);
  const activePanel = momentRequest ? "create" : panel;
  const closePanel = () => { setPanel(null); setSelectedId(null); if (momentRequest) closeLegacyIntent(); };
  const grid = view === "memories";
  const columnWidth = Math.max(0, (width - memoryFeedTokens.gutter * 2 - memoryFeedTokens.gridGap) / 2);

  const empty = loading || (!failed && !scoped) ? <HomeLoadingView />
    : failed ? <AsyncStateView variant="error" title="memoryFeedLoadError" description="memoryFeedLoadErrorBody" actionLabel="retry" onAction={() => void load()} />
    : !scoped?.coupleId ? <AsyncStateView variant="empty" title="connectionEmptyTitle" description="connectionEmptyBody" actionLabel="fabConnection" onAction={() => router.push("/connection")} />
    : <YStack alignItems="center" justifyContent="center" gap="$md" paddingVertical="$xxl" paddingHorizontal="$lg" minHeight={320}>
      <ImagePlus size={36} strokeWidth={1.3} color="$accentText" aria-hidden={true} />
      <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$semibold" color="$textPrimary" textAlign="center">{getMessage("vi", grid ? "memoryGalleryEmptyTitle" : "memoryFeedEmptyTitle")}</Text>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="center">{getMessage("vi", grid ? "memoryGalleryEmptyBody" : "memoryFeedEmptyBody")}</Text>
      <AppButton variant="ghost" onPress={() => setPanel("create")}>{getMessage("vi", "memoryFeedAdd")}</AppButton>
    </YStack>;

  return <AppScreen scroll={false} padded={false} safeAreaEdges={["left", "right", "bottom"]} contentProps={{ flex: 1, gap: 0 }}>
    <YStack flex={1} width="100%" maxWidth={memoryFeedTokens.maxWidth} alignSelf="center" onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <AppBlurTarget ref={blurTarget} style={{ flex: 1, width: "100%" }}>
      <FlatList
        key={view}
        data={loading || failed || !scoped ? [] : records}
        keyExtractor={(record) => record.id}
        numColumns={grid ? 2 : 1}
        columnWrapperStyle={grid ? { gap: memoryFeedTokens.gridGap } : undefined}
        renderItem={({ item }) => grid ? <YStack width={columnWidth}><MemoryGalleryTile memory={item} /></YStack> : <MemoryFeedPost memory={item} onDetails={() => { setSelectedId(item.id); setPanel("details"); }} />}
        ListEmptyComponent={empty}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: memoryFeedTokens.gutter, paddingTop: insets.top + memoryFeedTokens.headerHeight + 8, paddingBottom: memoryFeedTokens.navigationClearance }}
        style={{ flex: 1 }}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        refreshing={refreshing}
        onRefresh={() => void load(true)}
        onScroll={handleFeedScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
      />
      </AppBlurTarget>
      <MemoryFeedHeader key={accountId} topInset={insets.top} blurTarget={blurTarget} view={view} hidden={headerHidden} onViewChange={setView} onAdd={() => setPanel("create")} onNotifications={() => setPanel("notifications")} />
    </YStack>
    {panelOpen && activePanel === "create" ? <MemoryComposerDialog key={accountId} blurTarget={blurTarget} onClose={closePanel} /> : null}
    <AppSheet open={panelOpen && activePanel !== "create"} onOpenChange={(open) => { if (!open) closePanel(); }}
      title={getMessage("vi", activePanel === "notifications" ? "memoryFeedNotifications" : activePanel === "details" ? "memoryFeedDetails" : "memoryFeedAdd")}
      description={activePanel === "details" ? selected?.title : getMessage("vi", activePanel === "notifications" ? "memoryFeedNotificationsUnavailable" : "memoryFeedCreateUnavailable")}>
      {activePanel === "details" && selected ? <YStack gap="$md">
        <Text fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{formatMemoryDate(selected.memory_date, "vi") ?? getMessage("vi", "memoryFeedUnknownDate")}</Text>
        {selected.location ? <Text fontFamily="$body" fontSize="$bodyM" color="$textPrimary">{selected.location}</Text> : null}
        <Text fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{formatMessage("vi", "memoryFeedPhotoCount", { count: selected.image_count })}</Text>
      </YStack> : null}
    </AppSheet>
  </AppScreen>;
}
