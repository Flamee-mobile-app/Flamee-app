import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppTextButton, appToast } from "../../shared/components";
import { colors } from "../../shared/constants/tokens";
import { getMessage } from "../../shared/localization/messages";
import { conversationCurrent, conversationKeys, conversationService } from "./conversationService";
import { useConversationContext } from "./useConversationContext";

export function PostHeartAction({ memoryId, inverse = false }: { memoryId: string; inverse?: boolean }) {
  const { scope, ready, active } = useConversationContext();
  const client = useQueryClient();
  const key = [...conversationKeys.scope(scope), "post-heart", memoryId];
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => conversationService.postHeart(scope, memoryId, undefined, signal), enabled: ready && active, retry: false, staleTime: 15000 });
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    if (lock.current || !ready || !active) return;
    if (!query.data || query.isError) { void query.refetch(); return; }
    const feedback = appToast.operation();
    const desired = !query.data.hearted;
    lock.current = true; setBusy(true);
    try {
      await client.cancelQueries({ queryKey: key });
      const saved = await conversationService.postHeart(scope, memoryId, desired);
      if (conversationCurrent(scope)) { client.setQueryData(key, saved); feedback.success(getMessage("vi", desired ? "memoryHeartAdded" : "memoryHeartRemoved")); }
    } catch { if (conversationCurrent(scope)) { feedback.error(getMessage("vi", "conversationWriteError")); void client.invalidateQueries({ queryKey: key }); } }
    finally { lock.current = false; setBusy(false); }
  };
  const color = query.data?.hearted ? "$primary" : inverse ? "$white" : "$textSecondary";
  return <AppTextButton tone={inverse ? "inverse" : "neutral"} disabled={busy || query.isPending} size="compact" accessibilityLabel={getMessage("vi", query.data?.hearted ? "conversationUnheart" : "conversationHeart")}
    accessibilityHint={query.isError ? getMessage("vi", "memoryHeartUnavailable") : undefined}
    icon={<Heart size={21} color={color} fill={query.data?.hearted ? colors.primary : "none"} />} onPress={() => { void toggle(); }}>
    {query.data ? String(query.data.heart_count) : null}
  </AppTextButton>;
}
