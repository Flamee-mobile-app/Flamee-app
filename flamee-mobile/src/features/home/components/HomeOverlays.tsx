import { AppGradientText } from "../../../shared/components";
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState, type RefObject } from "react";
import { FlatList } from "react-native";
import { Text } from "tamagui";
import { AppButton, AppDialog, AppSheet, type AppBlurTargetView } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import type { MemoryScope, MemorySummary } from "../../moments";
import { homeOverlayReducer, initialHomeOverlay, type HomeOverlaySelection } from "../homeOverlayModel";
import { formatMemoryDate } from "../memoryFeedModel";
import { MemoryComposerDialog } from "./MemoryComposerDialog";
import { MemoryDetailView } from "./MemoryDetailView";
import { MemoryFeedPost } from "./MemoryFeedPost";
import { Redirect } from "expo-router";
import { useInlineMemoryEdit } from "../useInlineMemoryEdit";

export type HomeOverlayHandle = { show: (selection: HomeOverlaySelection) => void };
type Props = { scope: MemoryScope; records: MemorySummary[]; focused: boolean; blurTarget: RefObject<AppBlurTargetView | null>; momentRequest?: string; clearLegacyIntent: () => void; onPosted: () => void; onRefresh: () => void; partial: boolean };

export const HomeOverlays = memo(forwardRef<HomeOverlayHandle, Props>(function HomeOverlays({ scope, records, focused, blurTarget, momentRequest, clearLegacyIntent, onPosted, onRefresh, partial }, ref) {
  const [state, dispatch] = useReducer(homeOverlayReducer, initialHomeOverlay);
  const consumedIntent = useRef<string | undefined>(undefined);
  const { editor, begin, reset } = useInlineMemoryEdit(scope);
  const [discard, setDiscard] = useState<"close" | "cancel" | null>(null);
  const show = useCallback((selection: HomeOverlaySelection) => { reset(); setDiscard(null); dispatch({ type: "show", selection }); }, [reset]);
  useImperativeHandle(ref, () => ({ show }), [show]);
  useEffect(() => { if (!focused) { reset(); setDiscard(null); dispatch({ type: "reset" }); } }, [focused, reset]);
  useEffect(() => {
    if (focused && momentRequest && consumedIntent.current !== momentRequest) {
      consumedIntent.current = momentRequest;
      show({ kind: "create" });
    }
  }, [focused, momentRequest, show]);
  const close = useCallback(() => { dispatch({ type: "close" }); if (momentRequest) clearLegacyIntent(); }, [momentRequest, clearLegacyIntent]);
  const afterClose = useCallback(() => dispatch({ type: "exited", revision: state.revision }), [state.revision]);
  const requestExit = (intent: "close" | "cancel") => {
    if (editor?.busy || discard) return;
    if (editor?.dirty) { setDiscard(intent); return; }
    reset();
    if (intent === "close") close();
  };
  const sheetEditor = editor ? { ...editor, cancel: () => requestExit("cancel") } : null;
  const posted = useCallback(() => { close(); onPosted(); }, [close, onPosted]);
  const showDetails = useCallback((id: string) => show({ kind: "details", id }), [show]);
  const selection = state.selection;
  const selected = selection?.kind === "details" ? records.find((record) => record.id === selection.id) : undefined;
  const day = selection?.kind === "day" ? selection.day : null;
  const dayRecords = useMemo(() => day ? records.filter((record) => record.memory_date === day) : [], [day, records]);
  if (!focused || !selection) return null;
  if (selection.kind === "create") return <MemoryComposerDialog key={state.revision} open={state.open} blurTarget={blurTarget} onClose={close} onAfterClose={afterClose} onPosted={posted} />;
  if (selection.kind === "comments") return <Redirect href={{ pathname: "/memory/[memoryId]/comments", params: { memoryId: selection.id } }} />;
  const notification = selection.kind === "notifications";
  return <><AppSheet key={state.revision} open={state.open} fitContent disableDrag dismissible={!editor?.busy && !discard} onOpenChange={(open) => { if (!open) requestExit("close"); }} onAfterClose={afterClose}
    title={getMessage("vi", notification ? "memoryFeedNotifications" : editor ? "memoryEdit" : "memoryFeedDetails")}
    description={notification ? getMessage("vi", "memoryFeedNotificationsUnavailable") : undefined}
    renderBody={notification ? undefined : ({ maxHeight, paddingBottom }) => selected
      ? <MemoryDetailView key={selected.id} scope={scope} id={selected.id} summary={selected} availableHeight={maxHeight} paddingBottom={paddingBottom} enabled={state.open} onDeleted={close} onEdit={begin} editor={sheetEditor} />
      : day ? <DayMemories records={dayRecords} day={day} availableHeight={maxHeight} paddingBottom={paddingBottom} partial={partial} onDetails={showDetails} onRetry={onRefresh} /> : null} />
    {discard ? <AppDialog open aboveSheet avoidKeyboard title={getMessage("vi", "memoryDiscardTitle")} description={getMessage("vi", "memoryDiscardBody")} onOpenChange={(open) => { if (!open) setDiscard(null); }}>
      <AppButton variant="destructive" testID="memory-discard-confirm" onPress={() => { const intent = discard; reset(); setDiscard(null); if (intent === "close") close(); }}>{getMessage("vi", "memoryDiscardConfirm")}</AppButton>
      <AppButton variant="ghost" testID="memory-keep-editing" onPress={() => setDiscard(null)}>{getMessage("vi", "memoryKeepEditing")}</AppButton>
    </AppDialog> : null}
  </>;
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
