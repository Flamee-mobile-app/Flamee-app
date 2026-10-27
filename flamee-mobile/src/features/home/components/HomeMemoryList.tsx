import { AppGradientText } from "../../../shared/components";
import { ImagePlus } from "@tamagui/lucide-icons-2/icons/ImagePlus";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Text, YStack } from "tamagui";
import { AppButton, AsyncStateView, shouldShowInitialSkeleton } from "../../../shared/components";
import { memoryFeedTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import type { MemorySummary } from "../../moments";
import { buildMemoryCalendar, getMemoryCalendarScrollLayout, getMemoryFeedHeaderClearance, type MemoryCalendarMonth } from "../memoryCalendarModel";
import { selectMemoryFeed, type MemoryFeedView } from "../memoryFeedModel";
import { HomeLoadingView } from "./HomeLoadingView";
import { MemoryCalendarConnector, MemoryCalendarMonthCard, MemoryCalendarStats } from "./MemoryCalendar";
import { MemoryFeedPost } from "./MemoryFeedPost";

const FeedRow = memo(function FeedRow({ memory, onDetails, onRetry }: { memory: MemorySummary; onDetails: (id: string) => void; onRetry: () => void }) {
  const details = useCallback(() => onDetails(memory.id), [memory.id, onDetails]);
  return <MemoryFeedPost memory={memory} onDetails={details} onPhotoRetry={onRetry} />;
});

type Props = {
  records: MemorySummary[]; view: MemoryFeedView; today: string; topInset: number;
  loading: boolean; failed: boolean; paired: boolean; confirmed: boolean;
  refreshing: boolean; loadingMore: boolean; hasMore: boolean;
  onRefresh: () => void; onMore: () => void; onConnect: () => void;
  onDetails: (id: string) => void; onDay: (day: string) => void; onAdd: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

/** Popup state and body measurements never enter this list's render boundary. */
export const HomeMemoryList = memo(function HomeMemoryList({ records, view, today, topInset, loading, failed, paired, confirmed, refreshing, loadingMore, hasMore, onRefresh, onMore, onConnect, onDetails, onDay, onAdd, onScroll }: Props) {
  const calendar = useRef<FlatList<MemoryCalendarMonth>>(null);
  const grid = view === "memories";
  const months = useMemo(() => grid && paired ? buildMemoryCalendar(records, today, hasMore) : [], [grid, paired, records, today, hasMore]);
  const feed = useMemo(() => !grid ? selectMemoryFeed(records, "timeline") : [], [grid, records]);
  const scroll = getMemoryCalendarScrollLayout(topInset);
  useEffect(() => { if (grid) calendar.current?.scrollToOffset({ offset: 0, animated: false }); }, [grid]);
  const renderPost = useCallback(({ item }: { item: MemorySummary }) => <FeedRow memory={item} onDetails={onDetails} onRetry={onRefresh} />, [onDetails, onRefresh]);
  const renderMonth = useCallback(({ item }: { item: MemoryCalendarMonth }) => <MemoryCalendarMonthCard month={item} onDay={onDay} onAdd={onAdd} />, [onDay, onAdd]);
  const footer = hasMore ? <AppButton fill variant="ghost" loading={loadingMore} disabled={refreshing} onPress={onMore}>{getMessage("vi", "memoryLoadOlder")}</AppButton> : null;
  const refreshError = failed && confirmed ? <YStack paddingBottom="$lg" gap="$sm"><Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$accentText">{getMessage("vi", "memoryFeedLoadErrorBody")}</Text><AppButton variant="ghost" onPress={onRefresh}>{getMessage("vi", "retry")}</AppButton></YStack> : null;
  const empty = shouldShowInitialSkeleton({ pending: loading, hasConfirmedContent: confirmed }) ? <HomeLoadingView />
    : failed && !confirmed ? <AsyncStateView variant="error" title="memoryFeedLoadError" description="memoryFeedLoadErrorBody" actionLabel="retry" onAction={onRefresh} />
    : !paired ? <AsyncStateView variant="empty" title="connectionEmptyTitle" description="connectionEmptyBody" actionLabel="fabConnection" onAction={onConnect} />
    : <YStack alignItems="center" justifyContent="center" gap="$md" paddingVertical="$xxl" paddingHorizontal="$lg" minHeight={320}>
      <ImagePlus size={36} strokeWidth={1.3} color="$accentText" aria-hidden={true} />
      <AppGradientText fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$semibold" color="$textPrimary" textAlign="center">{getMessage("vi", grid ? "memoryGalleryEmptyTitle" : "memoryFeedEmptyTitle")}</AppGradientText>
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="center">{getMessage("vi", grid ? "memoryGalleryEmptyBody" : "memoryFeedEmptyBody")}</Text>
      <AppButton variant="ghost" onPress={onAdd}>{getMessage("vi", "memoryFeedAdd")}</AppButton>
    </YStack>;
  if (grid && paired && confirmed) return <FlatList key="calendar" ref={calendar} inverted={scroll.inverted} maintainVisibleContentPosition={{ minIndexForVisible: 0 }} initialScrollIndex={0}
    data={months} keyExtractor={monthKey} renderItem={renderMonth} ItemSeparatorComponent={MemoryCalendarConnector}
    ListHeaderComponent={<YStack>{refreshError}<MemoryCalendarStats records={records} today={today} partial={hasMore} /></YStack>}
    ListFooterComponent={footer}
    contentContainerStyle={{ paddingHorizontal: memoryFeedTokens.gutter, paddingTop: scroll.paddingTop, paddingBottom: scroll.paddingBottom }}
    initialNumToRender={2} maxToRenderPerBatch={2} windowSize={5} refreshing={refreshing} onRefresh={onRefresh}
    onEndReached={onMore} onEndReachedThreshold={0.3} onScroll={onScroll} scrollEventThrottle={32} showsVerticalScrollIndicator={false} style={{ flex: 1 }} />;
  return <FlatList key="feed" data={feed} keyExtractor={memoryKey} renderItem={renderPost} ListEmptyComponent={empty} ListHeaderComponent={refreshError} ListFooterComponent={footer}
    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: memoryFeedTokens.gutter, paddingTop: getMemoryFeedHeaderClearance(topInset), paddingBottom: memoryFeedTokens.navigationClearance }}
    initialNumToRender={4} maxToRenderPerBatch={4} windowSize={5} refreshing={refreshing} onRefresh={onRefresh}
    onEndReached={onMore} onEndReachedThreshold={0.3} onScroll={onScroll} scrollEventThrottle={32} showsVerticalScrollIndicator={false} style={{ flex: 1 }} />;
});

const monthKey = (month: MemoryCalendarMonth) => month.key;
const memoryKey = (memory: MemorySummary) => memory.id;
