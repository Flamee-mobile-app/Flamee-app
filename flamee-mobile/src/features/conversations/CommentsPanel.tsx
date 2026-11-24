import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FlatList } from "react-native";
import { Send } from "@tamagui/lucide-icons-2/icons/Send";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { randomUUID } from "expo-crypto";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, XStack, YStack } from "tamagui";
import { AppAnimatedAction, AppButton, AppDialog, AppField, AppIconButton, AppSkeleton, AppTextButton, appToast } from "../../shared/components";
import { fieldTokens } from "../../shared/constants/tokens";
import { formatMessage, getMessage, type MessageKey } from "../../shared/localization/messages";
import { memoryQueryKeys } from "../moments";
import { conversationCurrent, conversationKeys, conversationService } from "./conversationService";
import { ConversationError, type MemoryComment } from "./conversationApi";
import { useConversationContext } from "./useConversationContext";
import { CommentRow } from "./CommentRow";
import { CommentActionsMenu } from "./CommentActionsMenu";
import type { PopupAnchor } from "../../shared/components/anchoredPopupModel";
import { getCommentAuthorName, getReplyAuthorName, mergeCommentAcknowledgement, orderCommentThreads, type CommentPage } from "./conversationModel";
import type { InfiniteData } from "@tanstack/react-query";
import { authService } from "../auth";

export function CommentsPanel({ memoryId, height, enabled = true, targetCommentId, header, scrollToLatestOnMount = true, edgeToEdge = false }: { memoryId: string; height?: number; enabled?: boolean; targetCommentId?: string; header?: ReactNode | ((count: number | undefined) => ReactNode); scrollToLatestOnMount?: boolean; edgeToEdge?: boolean }) {
  const { scope, ready, active } = useConversationContext();
  const client = useQueryClient();
  const live = useRef(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const list = useRef<FlatList<MemoryComment>>(null);
  const nearBottom = useRef(scrollToLatestOnMount && !targetCommentId);
  const scrolledToTarget = useRef(false);
  const refreshingMembership = useRef(false);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const [body, setBody] = useState("");
  const [reply, setReply] = useState<MemoryComment | null>(null);
  const [editing, setEditing] = useState<MemoryComment | null>(null);
  const [deleting, setDeleting] = useState<MemoryComment | null>(null);
  const [menu, setMenu] = useState<{ id: string; anchor: PopupAnchor } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const lock = useRef(false);
  const request = useRef<{ body: string; parent: string | null; key: string } | null>(null);
  const query = useInfiniteQuery({ queryKey: conversationKeys.comments(scope, memoryId), queryFn: ({ pageParam, signal }) => conversationService.list(scope, memoryId, pageParam, signal), initialPageParam: 0,
    getNextPageParam: (last, _pages, offset) => offset + last.items.length < last.total && last.items.length ? offset + last.items.length : undefined,
    enabled: ready && active && enabled, retry: false, refetchInterval: active && enabled ? 10000 : false });
  const target = useQuery({ queryKey: [...conversationKeys.comments(scope, memoryId), "target", targetCommentId], queryFn: ({ signal }) => conversationService.comment(scope, memoryId, targetCommentId!, signal), enabled: ready && active && enabled && !!targetCommentId, retry: false });
  const comments = useMemo(() => {
    const rows = new Map<string, MemoryComment>();
    if (target.data) rows.set(target.data.id, target.data);
    query.data?.pages.forEach((page) => page.items.forEach((item) => rows.set(item.id, item)));
    return orderCommentThreads([...rows.values()]);
  }, [query.data, target.data]);
  const current = () => live.current && enabledRef.current && conversationCurrent(scope);
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: conversationKeys.scope(scope) });
    void client.invalidateQueries({ queryKey: memoryQueryKeys.scope(scope) });
  };
  const mutate = async (action: () => Promise<MemoryComment>, done?: (acknowledgement: MemoryComment) => void, insert = false, isSending = false, successMessage?: MessageKey) => {
    if (lock.current || !current()) return;
    const feedback = successMessage ? appToast.operation() : null;
    lock.current = true; setBusy(true); setSending(isSending); setFailed(false); setConflict(false);
    try {
      const acknowledgement = await action();
      if (current()) {
        client.setQueryData<InfiniteData<CommentPage, number>>(conversationKeys.comments(scope, memoryId), (old) => mergeCommentAcknowledgement(old, acknowledgement, insert));
        if (targetCommentId === acknowledgement.id) client.setQueryData([...conversationKeys.comments(scope, memoryId), "target", targetCommentId], acknowledgement);
        done?.(acknowledgement); invalidate();
        if (successMessage) feedback?.success(getMessage("vi", successMessage));
      }
    }
    catch (error) { if (current()) { setFailed(true); setConflict(error instanceof ConversationError && error.code === "conflict"); feedback?.error(getMessage("vi", error instanceof ConversationError && error.code === "conflict" ? "conversationConflict" : "conversationWriteError")); if (error instanceof ConversationError && error.code === "forbidden") setRevoked(true); invalidate(); } }
    finally { lock.current = false; if (live.current) { setBusy(false); setSending(false); } }
  };
  const send = () => {
    const text = body.trim();
    if (busy || query.isPending || query.isError || conflict && editing || editing?.deleted || !text || Array.from(text).length > 1000) return;
    const parent = reply?.id ?? null;
    if (!request.current || request.current.body !== text || request.current.parent !== parent) request.current = { body: text, parent, key: randomUUID() };
    const key = request.current.key;
    void mutate(() => editing ? conversationService.edit(scope, memoryId, editing.id, text, editing.version) : conversationService.send(scope, memoryId, text, parent, key), () => { nearBottom.current = true; setBody(""); setReply(null); setEditing(null); request.current = null; }, !editing, true, editing ? "conversationSaved" : reply ? "conversationReplySent" : "conversationSent");
  };
  const denied = revoked || query.error instanceof ConversationError && query.error.code === "forbidden" || target.error instanceof ConversationError && target.error.code === "forbidden";
  const targetMissing = target.error instanceof ConversationError && target.error.code === "not_found";
  const unavailable = denied || query.error instanceof ConversationError && query.error.code === "not_found";
  const selectedComment = ready && active && !busy && !unavailable && enabled && menu ? comments.find((comment) => comment.id === menu.id && !comment.deleted) : undefined;
  useEffect(() => { if (!enabled) setMenu(null); }, [enabled]);
  useEffect(() => { if (query.data && !query.error) { setRevoked(false); refreshingMembership.current = false; } }, [query.dataUpdatedAt]);
  useEffect(() => {
    if (!denied || refreshingMembership.current) return;
    refreshingMembership.current = true;
    setBody(""); setReply(null); setEditing(null); setDeleting(null); setMenu(null); request.current = null;
    void authService.refreshCurrentSession().catch(() => undefined);
  }, [denied]);
  const scrollTarget = () => {
    if (!targetCommentId || scrolledToTarget.current) return;
    const index = comments.findIndex((item) => item.id === targetCommentId);
    if (index >= 0) list.current?.scrollToIndex({ index, animated: false, viewPosition: 0.3 });
  };
  return <YStack flex={height === undefined ? 1 : undefined} height={height} minHeight={0} gap="$sm">
    {!ready ? <Text color="$textSecondary" fontFamily="$body" fontSize="$bodyM">{getMessage("vi", "inboxConnect")}</Text> : <>
      {query.isPending && !header ? <AppSkeleton height={70} width="100%" /> : null}
      {query.isError || target.isError || revoked ? <YStack gap="$sm"><Text role="alert" color="$accentText" fontFamily="$body" fontSize="$bodyM">{getMessage("vi", unavailable || targetMissing ? "conversationUnavailable" : "conversationReadError")}</Text><AppButton variant="ghost" onPress={() => { void query.refetch(); if (targetCommentId) void target.refetch(); }}>{getMessage("vi", "retry")}</AppButton></YStack> : null}
      <FlatList ref={list} style={{ flex: 1, minHeight: 0 }} data={unavailable ? [] : comments} keyExtractor={(item) => item.id} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onScroll={({ nativeEvent: e }) => { nearBottom.current = e.contentSize.height - e.contentOffset.y - e.layoutMeasurement.height < 60; }} onScrollBeginDrag={() => setMenu(null)} scrollEventThrottle={32}
        onContentSizeChange={() => { if (targetCommentId && !scrolledToTarget.current) scrollTarget(); else if (nearBottom.current && comments.length) list.current?.scrollToEnd({ animated: false }); }}
        onScrollToIndexFailed={({ index, averageItemLength }) => list.current?.scrollToOffset({ offset: index * averageItemLength, animated: false })}
        onViewableItemsChanged={({ viewableItems }) => { if (viewableItems.some((entry) => entry.item.id === targetCommentId)) scrolledToTarget.current = true; }}
        ListHeaderComponent={<YStack gap="$md">{!unavailable ? typeof header === "function" ? header(query.data?.pages[0]?.comment_count) : header : null}{query.hasNextPage ? <AppButton variant="ghost" loading={query.isFetchingNextPage} onPress={() => { void query.fetchNextPage(); }}>{getMessage("vi", "conversationOlder")}</AppButton> : null}</YStack>}
        ListEmptyComponent={query.isPending && header ? <AppSkeleton height={70} width="100%" /> : !edgeToEdge && query.data && !query.isError && !unavailable ? <Text padding="$lg" textAlign="center" fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "conversationEmpty")}</Text> : null}
        renderItem={({ item, index }) => <YStack paddingHorizontal={edgeToEdge ? "$lg" : 0}><CommentRow comment={item} parentName={getReplyAuthorName(item, comments)} busy={busy} highlighted={item.id === targetCommentId} lastReply={comments[index + 1]?.parent_id !== item.parent_id}
          onReply={() => { setReply(item); setEditing(null); setConflict(false); }}
          onOpenActions={(anchor) => setMenu({ id: item.id, anchor })} onHeart={() => { void mutate(() => conversationService.heart(scope, memoryId, item.id, !item.hearted), undefined, false, false, item.hearted ? "conversationHeartRemoved" : "conversationHeartAdded"); }} /></YStack>} />
      {failed ? <Text role="alert" fontFamily="$body" fontSize="$bodyS" color="$accentText">{getMessage("vi", conflict ? "conversationConflict" : "conversationWriteError")}</Text> : null}
      {!unavailable ? <YStack gap="$sm" flexShrink={0} paddingHorizontal={edgeToEdge ? "$lg" : 0} paddingTop={edgeToEdge ? "$sm" : 0} paddingBottom={edgeToEdge ? "$sm" : 0} backgroundColor={edgeToEdge ? "$white" : "transparent"}>
        {reply || editing ? <XStack gap="$sm" alignItems="center"><Text flex={1} fontFamily="$body" fontSize="$bodyS" color="$accentText">{editing ? getMessage("vi", "conversationEdit") : formatMessage("vi", "conversationReplying", { name: getCommentAuthorName(reply!.author) })}</Text><AppTextButton disabled={busy} onPress={() => { setReply(null); setEditing(null); setBody(""); setConflict(false); request.current = null; }}>{getMessage("vi", "conversationCancel")}</AppTextButton></XStack> : null}
        {conflict && editing ? <AppButton variant="ghost" disabled={busy} onPress={() => { void mutate(() => conversationService.comment(scope, memoryId, editing.id), (latest) => setEditing(latest)); }}>{getMessage("vi", "conversationReload")}</AppButton> : null}
        {editing ? <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary" numberOfLines={2}>{editing.deleted ? getMessage("vi", "conversationDeleted") : formatMessage("vi", "conversationLatest", { body: editing.body })}</Text> : null}
        <AppField key={editing ? `edit:${editing.id}` : reply ? `reply:${reply.id}` : "new"} id="comment-composer" autoFocus={!!editing || !!reply} showLabel={false} label={getMessage("vi", "conversationInput")} placeholder={getMessage("vi", "conversationPlaceholder")} value={body} onChangeText={setBody} editable={!sending}
          multiline autoGrow maxAutoGrowLines={4} autoGrowMinHeight={fieldTokens.minHeight} autoGrowPaddingHorizontal={fieldTokens.paddingHorizontal} autoGrowPaddingVertical={fieldTokens.paddingVertical} autoGrowTextAlignVertical="top"
          maxLength={2000} error={Array.from(body.trim()).length > 1000 ? getMessage("vi", "conversationLimit") : undefined}
          endActionAlign="bottom" endAction={<AppAnimatedAction visible={body.length > 0}><AppIconButton testID="comment-submit" tone="plain" preventNativeFocus accessibilityLabel={getMessage("vi", sending ? "conversationSending" : editing ? "conversationSave" : "conversationSend")} icon={editing ? <Check size={20} color="$primary" /> : <Send size={20} color="$primary" />} disabled={!body.length || busy || !body.trim() || Array.from(body.trim()).length > 1000 || query.isPending || query.isError || conflict && !!editing || !!editing?.deleted} onPress={send} /></AppAnimatedAction>} />
      </YStack> : null}
    </>}
    {selectedComment && menu ? <CommentActionsMenu comment={selectedComment} anchor={menu.anchor} accountId={scope.accountId} onClose={() => setMenu(null)} onAction={(action) => {
      setConflict(false);
      if (action === "reply") { setReply(selectedComment); setEditing(null); }
      if (action === "edit") { setEditing(selectedComment); setReply(null); setBody(selectedComment.body); }
      if (action === "delete") setDeleting(selectedComment);
      if (action === "heart") void mutate(() => conversationService.heart(scope, memoryId, selectedComment.id, !selectedComment.hearted), undefined, false, false, selectedComment.hearted ? "conversationHeartRemoved" : "conversationHeartAdded");
    }} /> : null}
    <AppDialog open={deleting !== null} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }} dismissible={!busy} title={getMessage("vi", "conversationDeleteTitle")} description={getMessage("vi", "conversationDeleteBody")}>
      {deleting ? <Text fontFamily="$body" fontSize="$bodyM" color="$textPrimary" numberOfLines={4}>{deleting.body}</Text> : null}
      {conflict ? <><Text role="alert" fontFamily="$body" fontSize="$bodyS" color="$accentText">{getMessage("vi", "conversationConflict")}</Text><AppButton variant="ghost" disabled={busy} onPress={() => { if (deleting) void mutate(() => conversationService.comment(scope, memoryId, deleting.id), (latest) => setDeleting(latest.deleted ? null : latest)); }}>{getMessage("vi", "conversationReload")}</AppButton></> : null}
      <AppButton variant="destructive" loading={busy} disabled={conflict} onPress={() => { if (deleting) void mutate(() => conversationService.remove(scope, memoryId, deleting.id, deleting.version), () => setDeleting(null), false, false, "conversationRemoved"); }}>{getMessage("vi", "conversationDelete")}</AppButton>
      <AppButton variant="ghost" disabled={busy} onPress={() => setDeleting(null)}>{getMessage("vi", "conversationCancel")}</AppButton>
    </AppDialog>
  </YStack>;
}
