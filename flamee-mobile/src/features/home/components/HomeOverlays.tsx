import { AppGradientText } from "../../../shared/components";
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState, type RefObject } from "react";
import { FlatList } from "react-native";
import { Text } from "tamagui";
import { AppSheet, type AppBlurTargetView } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import type { MemoryScope, MemorySummary } from "../../moments";
import { homeOverlayReducer, initialHomeOverlay, type HomeOverlaySelection } from "../homeOverlayModel";
import { formatMemoryDate } from "../memoryFeedModel";
import { MemoryComposerDialog } from "./MemoryComposerDialog";
import { MemoryDetailView } from "./MemoryDetailView";
import { MemoryFeedPost } from "./MemoryFeedPost";

export type HomeOverlayHandle = { show: (selection: HomeOverlaySelection) => void };
type Props = { scope: MemoryScope; records: MemorySummary[]; focused: boolean; blurTarget: RefObject<AppBlurTargetView | null>; momentRequest?: string; clearLegacyIntent: () => void; onPosted: () => void; onRefresh: () => void; partial: boolean };

export const HomeOverlays = memo(forwardRef<HomeOverlayHandle, Props>(function HomeOverlays({ scope, records, focused, blurTarget, momentRequest, clearLegacyIntent, onPosted, onRefresh, partial }, ref) {
  const [state, dispatch] = useReducer(homeOverlayReducer, initialHomeOverlay);
  const consumedIntent = useRef<string | undefined>(undefined);
  const show = useCallback((selection: HomeOverlaySelection) => dispatch({ type: "show", selection }), []);
  useImperativeHandle(ref, () => ({ show }), [show]);
  useEffect(() => { if (!focused) dispatch({ type: "reset" }); }, [focused]);
  useEffect(() => {
    if (focused && momentRequest && consumedIntent.current !== momentRequest) {
      consumedIntent.current = momentRequest;
      show({ kind: "create" });
    }
  }, [focused, momentRequest, show]);
  const close = useCallback(() => { dispatch({ type: "close" }); if (momentRequest) clearLegacyIntent(); }, [momentRequest, clearLegacyIntent]);
  const afterClose = useCallback(() => dispatch({ type: "exited", revision: state.revision }), [state.revision]);
  const posted = useCallback(() => { close(); onPosted(); }, [close, onPosted]);
  const showDetails = useCallback((id: string) => show({ kind: "details", id }), [show]);
  const selection = state.selection;
  const selected = selection?.kind === "details" ? records.find((record) => record.id === selection.id) : undefined;
  const day = selection?.kind === "day" ? selection.day : null;
  const dayRecords = useMemo(() => day ? records.filter((record) => record.memory_date === day) : [], [day, records]);
  if (!focused || !selection) return null;
  if (selection.kind === "create") return <MemoryComposerDialog key={state.revision} open={state.open} blurTarget={blurTarget} onClose={close} onAfterClose={afterClose} onPosted={posted} />;
  const notification = selection.kind === "notifications";
  return <AppSheet key={state.revision} open={state.open} fitContent disableDrag onOpenChange={(open) => { if (!open) close(); }} onAfterClose={afterClose}
    title={getMessage("vi", notification ? "memoryFeedNotifications" : "memoryFeedDetails")}
    description={notification ? getMessage("vi", "memoryFeedNotificationsUnavailable") : undefined}
    renderBody={notification ? undefined : ({ maxHeight, paddingBottom }) => selected
      ? <MemoryDetailView key={selected.id} scope={scope} id={selected.id} summary={selected} availableHeight={maxHeight} paddingBottom={paddingBottom} enabled={state.open} />
      : day ? <DayMemories records={dayRecords} day={day} availableHeight={maxHeight} paddingBottom={paddingBottom} partial={partial} onDetails={showDetails} onRetry={onRefresh} /> : null} />;
}));

const DayRow = memo(function DayRow({ memory, onDetails, onRetry }: { memory: MemorySummary; onDetails: (id: string) => void; onRetry: () => void }) {
  const open = useCallback(() => onDetails(memory.id), [memory.id, onDetails]);
  return <MemoryFeedPost memory={memory} onDetails={open} onPhotoRetry={onRetry} />;
});

function DayMemories({ records, day, availableHeight, paddingBottom, partial, onDetails, onRetry }: { records: MemorySummary[]; day: string; availableHeight: number; paddingBottom: number; partial: boolean; onDetails: (id: string) => void; onRetry: () => void }) {
  const [contentHeight, setContentHeight] = useState(0);
  const renderItem = useCallback(({ item }: { item: MemorySummary }) => <DayRow memory={item} onDetails={onDetails} onRetry={onRetry} />, [onDetails, onRetry]);
  return <FlatList data={records} keyExtractor={memoryKey} renderItem={renderItem} initialNumToRender={2} maxToRenderPerBatch={2} windowSize={3}
    style={{ height: Math.min(availableHeight, contentHeight || availableHeight), width: "100%" }}
    onContentSizeChange={(_width, height) => setContentHeight(Math.round(height))}
    contentContainerStyle={{ paddingBottom }} showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<AppGradientText marginBottom="$lg" fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">{formatMemoryDate(day, "vi")}</AppGradientText>}
    ListFooterComponent={partial ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "memoryCalendarPartial")}</Text> : null} />;
}
const memoryKey = (record: MemorySummary) => record.id;
