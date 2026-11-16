import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList } from "react-native";
import { Bell } from "@tamagui/lucide-icons-2/icons/Bell";
import { ArrowLeft } from "@tamagui/lucide-icons-2/icons/ArrowLeft";
import { CheckCheck } from "@tamagui/lucide-icons-2/icons/CheckCheck";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppIconButton, AppNotificationRow, AppScreen, AppSkeleton, appToast } from "../../shared/components";
import { formatMessage, getMessage } from "../../shared/localization/messages";
import { conversationCurrent, conversationKeys, conversationService } from "./conversationService";
import { useConversationContext } from "./useConversationContext";
import { ConversationError, type CoupleNotice } from "./conversationApi";
import { authService } from "../auth";
import { moodService, reminderCurrent, reminderKey, reminderOptions, useMoodReminderCapability, type MoodReminder } from "../checkins";

export function NotificationsScreen() {
  const context = useConversationContext();
  return <NotificationsBody key={context.key} />;
}
function NotificationsBody() {
  const { scope, ready, active } = useConversationContext();
  const router = useRouter();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);
  const pending = useRef(false);
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const query = useInfiniteQuery({ queryKey: [...conversationKeys.inbox(scope), "pages"], queryFn: ({ pageParam, signal }) => conversationService.inbox(scope, pageParam, signal), initialPageParam: 0,
    getNextPageParam: (last, _pages, offset) => last.items.length && offset + last.items.length < last.total ? offset + last.items.length : undefined,
    enabled: ready && active, retry: false, refetchInterval: active ? 15000 : false });
  const reminderScope = { accountId: scope.accountId, sessionId: scope.sessionId };
  const capability = useMoodReminderCapability(reminderScope);
  const reminders = useInfiniteQuery({ ...reminderOptions(reminderScope), enabled: Boolean(scope.accountId && active && capability.data?.dual_mood_nudge) });
  const reminderItems = [...new Map(reminders.data?.pages.flatMap((page) => page.items).map((item) => [item.id, item]) ?? []).values()];
  const denied = revoked || query.error instanceof ConversationError && query.error.code === "forbidden";
  const checkedMembership = useRef(false);
  useEffect(() => { if (query.data && !query.error) { setRevoked(false); checkedMembership.current = false; } }, [query.dataUpdatedAt]);
  useEffect(() => { if (denied && !checkedMembership.current) { checkedMembership.current = true; void authService.refreshCurrentSession().catch(() => undefined); } }, [denied]);
  const items = denied ? [] : [...new Map(query.data?.pages.flatMap((page) => page.items).map((item) => [item.id, item]) ?? []).values()];
  const read = async (item?: CoupleNotice) => {
    if (pending.current || !reminderCurrent(reminderScope) || (item && !conversationCurrent(scope))) return;
    pending.current = true; setBusy(true); setError(null);
    const feedback = appToast.operation();
    feedback.loading(getMessage("vi", "inboxMarkingRead"));
    try {
      const [result] = await Promise.all([
        ready ? conversationService.read(scope, item?.id) : Promise.resolve(null),
        !item && capability.data?.dual_mood_nudge ? moodService.readAllReminders(reminderScope) : Promise.resolve(null),
      ]);
      if (!live.current || !reminderCurrent(reminderScope) || (ready && !conversationCurrent(scope))) return;
      if (result) client.setQueryData([...conversationKeys.inbox(scope), "badge"], result);
      void client.invalidateQueries({ queryKey: conversationKeys.inbox(scope) });
      void client.invalidateQueries({ queryKey: reminderKey(reminderScope) });
      feedback.success(getMessage("vi", "inboxMarkedRead"));
      if (item) {
        if (!item.available || !item.memory_id) setError(getMessage("vi", "inboxUnavailable"));
        else router.push({ pathname: "/memory/[memoryId]/comments", params: { memoryId: item.memory_id, ...(item.comment_id ? { commentId: item.comment_id } : {}) } });
      }
    } catch (failure) {
      if (live.current && reminderCurrent(reminderScope) && (!ready || conversationCurrent(scope))) {
        void client.invalidateQueries({ queryKey: reminderKey(reminderScope) });
        feedback.error(getMessage("vi", "inboxError"));
        const missing = failure instanceof ConversationError && failure.code === "not_found";
        setError(getMessage("vi", missing ? "inboxUnavailable" : "inboxError"));
        if (missing) void client.invalidateQueries({ queryKey: conversationKeys.inbox(scope) });
        if (failure instanceof ConversationError && failure.code === "forbidden") setRevoked(true);
      }
    }
    finally { feedback.dismiss(); pending.current = false; if (live.current && reminderCurrent(reminderScope)) setBusy(false); }
  };
  const readReminder = async (item: MoodReminder) => {
    if (pending.current || !reminderCurrent(reminderScope)) return;
    pending.current = true; setBusy(true); setError(null);
    const feedback = appToast.operation();
    feedback.loading(getMessage("vi", "inboxMarkingRead"));
    try {
      const acknowledged = await moodService.readReminder(reminderScope, item.id);
      if (!live.current || !reminderCurrent(reminderScope)) return;
      if (acknowledged.id !== item.id || !acknowledged.read_at) throw new Error("Invalid reminder acknowledgement");
      void client.invalidateQueries({ queryKey: reminderKey(reminderScope) });
      feedback.success(getMessage("vi", "moodReminderRead"));
      router.push("/mood/check-in");
    } catch { if (live.current && reminderCurrent(reminderScope)) { setError(getMessage("vi", "moodReminderReadError")); feedback.error(getMessage("vi", "moodReminderReadError")); } }
    finally { feedback.dismiss(); pending.current = false; if (live.current && reminderCurrent(reminderScope)) setBusy(false); }
  };
  const combined = [
    ...reminderItems.map((item) => ({ type: "reminder" as const, item })),
    ...items.map((item) => ({ type: "conversation" as const, item })),
  ].sort((a, b) => Date.parse(b.item.created_at) - Date.parse(a.item.created_at));
  const hasUnread = (query.data?.pages[0]?.unread_count ?? 0) + (reminders.data?.pages[0]?.unread_count ?? 0) > 0;
  const reload = async () => {
    const results = await Promise.all([ready ? query.refetch() : Promise.resolve(null), capability.data?.dual_mood_nudge ? reminders.refetch() : Promise.resolve(null)]);
    if (live.current && reminderCurrent(reminderScope) && results.some((result) => result?.isError)) appToast.error(getMessage("vi", "inboxError"));
  };
  const icon = <YStack width={44} height={44} borderRadius={22} backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center"><Bell size={20} color="$accentText" aria-hidden /></YStack>;
  return <AppScreen scroll={false} padded={false} contentProps={{ flex: 1, gap: 0 }}>
    <XStack height={60} paddingHorizontal="$md" alignItems="center" gap="$sm">
      <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "back")} icon={<ArrowLeft size={22} color="$textPrimary" />} onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(main)"); }} />
      <Text flex={1} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary" role="heading" aria-level={1}>{getMessage("vi", "inboxTitle")}</Text>
      <AppIconButton testID="notifications-read-all" tone="plain" accessibilityLabel={getMessage("vi", "inboxReadAll")} disabled={busy || denied || (ready && query.isError) || reminders.isError || !hasUnread} icon={<CheckCheck size={22} color="$textPrimary" />} onPress={() => { void read(); }} />
    </XStack>
    {!scope.accountId ? <Text padding="$lg" fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "inboxConnect")}</Text> : <>
      {ready && query.isPending ? <YStack padding="$lg"><AppSkeleton height={76} width="100%" /></YStack> : null}
      {(ready && query.isError) || reminders.isError || error ? <YStack paddingHorizontal="$lg" gap="$sm"><Text role="alert" fontFamily="$body" fontSize="$bodyM" color="$accentText">{error ?? getMessage("vi", "inboxError")}</Text><AppButton variant="ghost" onPress={() => { void reload(); }}>{getMessage("vi", "retry")}</AppButton></YStack> : null}
      <FlatList data={combined} keyExtractor={(entry) => `${entry.type}:${entry.item.id}`} style={{ flex: 1 }} refreshing={query.isRefetching || reminders.isRefetching} onRefresh={() => { void reload(); }} showsVerticalScrollIndicator={false}
        ListEmptyComponent={!combined.length && ((ready && query.data && !query.isError && !denied) || (!ready && reminders.data && !reminders.isError)) ? <Text padding="$lg" textAlign="center" fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "inboxEmpty")}</Text> : null}
        renderItem={({ item: entry }) => {
          const label = entry.type === "reminder" ? formatMessage("vi", "moodReminderItem", { date: entry.item.local_date }) : formatMessage("vi", entry.item.kind === "comment" ? "inboxComment" : entry.item.kind === "reply" ? "inboxReply" : "inboxHeart", { name: entry.item.actor_name });
          return <AppNotificationRow label={label} timestamp={new Date(entry.item.created_at).toLocaleString("vi-VN")} unread={!entry.item.read_at} unreadLabel={getMessage("vi", "inboxUnreadItem")} icon={icon} disabled={busy} onPress={() => { if (entry.type === "reminder") void readReminder(entry.item); else void read(entry.item); }} />;
        }}
        ListFooterComponent={<YStack>{reminders.hasNextPage ? <AppButton variant="ghost" loading={reminders.isFetchingNextPage} onPress={() => { void reminders.fetchNextPage(); }}>{getMessage("vi", "moodReminderMore")}</AppButton> : null}{query.hasNextPage ? <AppButton variant="ghost" loading={query.isFetchingNextPage} onPress={() => { void query.fetchNextPage(); }}>{getMessage("vi", "inboxMore")}</AppButton> : null}</YStack>} />
    </>}
  </AppScreen>;
}
