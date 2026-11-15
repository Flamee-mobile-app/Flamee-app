import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList } from "react-native";
import { Bell } from "@tamagui/lucide-icons-2/icons/Bell";
import { Text, YStack } from "tamagui";
import { AppButton, AppSkeleton, FeatureScreen, SectionCard } from "../../shared/components";
import { formatMessage, getMessage } from "../../shared/localization/messages";
import { conversationCurrent, conversationKeys, conversationService } from "./conversationService";
import { useConversationContext } from "./useConversationContext";
import { ConversationError, type CoupleNotice } from "./conversationApi";
import { authService } from "../auth";

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
  const denied = revoked || query.error instanceof ConversationError && query.error.code === "forbidden";
  const checkedMembership = useRef(false);
  useEffect(() => { if (query.data && !query.error) { setRevoked(false); checkedMembership.current = false; } }, [query.dataUpdatedAt]);
  useEffect(() => { if (denied && !checkedMembership.current) { checkedMembership.current = true; void authService.refreshCurrentSession().catch(() => undefined); } }, [denied]);
  const items = denied ? [] : [...new Map(query.data?.pages.flatMap((page) => page.items).map((item) => [item.id, item]) ?? []).values()];
  const read = async (item?: CoupleNotice) => {
    if (pending.current || !conversationCurrent(scope)) return;
    pending.current = true; setBusy(true); setError(null);
    try {
      const result = await conversationService.read(scope, item?.id);
      if (!live.current || !conversationCurrent(scope)) return;
      client.setQueryData([...conversationKeys.inbox(scope), "badge"], result);
      void client.invalidateQueries({ queryKey: conversationKeys.inbox(scope) });
      if (item) {
        if (!item.available || !item.memory_id) setError(getMessage("vi", "inboxUnavailable"));
        else router.push({ pathname: "/memory/[memoryId]/comments", params: { memoryId: item.memory_id, ...(item.comment_id ? { commentId: item.comment_id } : {}) } });
      }
    } catch (failure) {
      if (live.current && conversationCurrent(scope)) {
        const missing = failure instanceof ConversationError && failure.code === "not_found";
        setError(getMessage("vi", missing ? "inboxUnavailable" : "inboxError"));
        if (missing) void client.invalidateQueries({ queryKey: conversationKeys.inbox(scope) });
        if (failure instanceof ConversationError && failure.code === "forbidden") setRevoked(true);
      }
    }
    finally { pending.current = false; if (live.current && conversationCurrent(scope)) setBusy(false); }
  };
  return <FeatureScreen title={getMessage("vi", "inboxTitle")} showBack scroll={false} withBottomNavigation={false}>
    {!ready ? <><Text fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "inboxConnect")}</Text><AppButton variant="secondary" onPress={() => router.push("/connection")}>{getMessage("vi", "fabConnection")}</AppButton></> : <>
      <AppButton variant="ghost" disabled={busy || denied || query.isError || !query.data?.pages[0]?.unread_count} onPress={() => { void read(); }}>{getMessage("vi", "inboxReadAll")}</AppButton>
      {query.isPending ? <AppSkeleton height={90} width="100%" /> : null}
      {query.isError || error ? <YStack gap="$sm"><Text role="alert" fontFamily="$body" fontSize="$bodyM" color="$accentText">{error ?? getMessage("vi", "inboxError")}</Text><AppButton variant="ghost" onPress={() => { void query.refetch(); }}>{getMessage("vi", "retry")}</AppButton></YStack> : null}
      <FlatList data={items} keyExtractor={(item) => item.id} style={{ flex: 1 }} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }} showsVerticalScrollIndicator={false}
        ListEmptyComponent={query.data && !query.isError && !denied ? <Text padding="$lg" textAlign="center" fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "inboxEmpty")}</Text> : null}
        renderItem={({ item }) => <YStack paddingBottom="$md"><SectionCard tone={item.read_at ? "white" : "peach"} disabled={busy} accessibilityLabel={formatMessage("vi", item.kind === "comment" ? "inboxComment" : item.kind === "reply" ? "inboxReply" : "inboxHeart", { name: item.actor_name })} onPress={() => { void read(item); }}>
          <Bell size={20} color="$accentText" aria-hidden />
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{formatMessage("vi", item.kind === "comment" ? "inboxComment" : item.kind === "reply" ? "inboxReply" : "inboxHeart", { name: item.actor_name })}</Text>
          <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{new Date(item.created_at).toLocaleString("vi-VN")}</Text>
        </SectionCard></YStack>}
        ListFooterComponent={query.hasNextPage ? <AppButton variant="ghost" loading={query.isFetchingNextPage} onPress={() => { void query.fetchNextPage(); }}>{getMessage("vi", "inboxMore")}</AppButton> : null} />
    </>}
  </FeatureScreen>;
}
