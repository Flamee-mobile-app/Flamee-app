import { Bell } from "@tamagui/lucide-icons-2/icons/Bell";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Text, YStack } from "tamagui";
import { AppIconButton } from "../../shared/components";
import { formatMessage, getMessage } from "../../shared/localization/messages";
import { conversationKeys, conversationService } from "./conversationService";
import { useConversationContext } from "./useConversationContext";
import { reminderOptions, useMoodReminderCapability } from "../checkins";

export function NotificationBell() {
  const router = useRouter();
  const { scope, ready, active } = useConversationContext();
  const query = useQuery({ queryKey: [...conversationKeys.inbox(scope), "badge"], queryFn: ({ signal }) => conversationService.inbox(scope, 0, signal), enabled: ready && active, retry: false, refetchInterval: active ? 15000 : false });
  const reminderScope = { accountId: scope.accountId, sessionId: scope.sessionId };
  const capability = useMoodReminderCapability(reminderScope);
  const reminders = useInfiniteQuery({ ...reminderOptions(reminderScope), enabled: Boolean(scope.accountId && active && capability.data?.dual_mood_nudge) });
  const reminderCount = capability.data?.dual_mood_nudge ? reminders.data?.pages[0]?.unread_count : 0;
  const count = (!ready || typeof query.data?.unread_count === "number") && typeof reminderCount === "number" ? (query.data?.unread_count ?? 0) + reminderCount : undefined;
  const failed = (ready && query.isError) || (Boolean(capability.data?.dual_mood_nudge) && reminders.isError);
  return <YStack>
    <AppIconButton testID="notification-bell" tone="floating" accessibilityLabel={typeof count === "number" ? formatMessage("vi", "inboxUnread", { count }) : getMessage("vi", "inboxTitle")} accessibilityHint={failed ? getMessage("vi", "inboxError") : undefined} icon={<Bell size={23} color="$primary" aria-hidden />} onPress={() => router.push("/notifications")} />
    {failed || !!count ? <YStack position="absolute" top={-2} right={-2} minWidth={18} height={18} paddingHorizontal="$xs" borderRadius={9} backgroundColor="$primary" alignItems="center" justifyContent="center" pointerEvents="none" accessible={false}>
      <Text fontFamily="$body" fontSize="$caption" color="$white">{failed ? "!" : count! > 99 ? "99+" : String(count)}</Text>
    </YStack> : null}
  </YStack>;
}
