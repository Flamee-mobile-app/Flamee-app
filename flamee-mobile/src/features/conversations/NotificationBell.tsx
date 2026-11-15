import { Bell } from "@tamagui/lucide-icons-2/icons/Bell";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Text, YStack } from "tamagui";
import { AppIconButton } from "../../shared/components";
import { formatMessage, getMessage } from "../../shared/localization/messages";
import { conversationKeys, conversationService } from "./conversationService";
import { useConversationContext } from "./useConversationContext";

export function NotificationBell() {
  const router = useRouter();
  const { scope, ready, active } = useConversationContext();
  const query = useQuery({ queryKey: [...conversationKeys.inbox(scope), "badge"], queryFn: ({ signal }) => conversationService.inbox(scope, 0, signal), enabled: ready && active, retry: false, refetchInterval: active ? 15000 : false });
  const count = query.data?.unread_count;
  return <YStack>
    <AppIconButton testID="notification-bell" tone="floating" accessibilityLabel={typeof count === "number" ? formatMessage("vi", "inboxUnread", { count }) : getMessage("vi", "inboxTitle")} accessibilityHint={query.isError ? getMessage("vi", "inboxError") : undefined} icon={<Bell size={23} color="$primary" aria-hidden />} onPress={() => router.push("/notifications")} />
    {ready && (query.isError || !!count) ? <YStack position="absolute" top={-2} right={-2} minWidth={18} height={18} paddingHorizontal="$xs" borderRadius={9} backgroundColor="$primary" alignItems="center" justifyContent="center" pointerEvents="none" accessible={false}>
      <Text fontFamily="$body" fontSize="$caption" color="$white">{query.isError ? "!" : count! > 99 ? "99+" : String(count)}</Text>
    </YStack> : null}
  </YStack>;
}
