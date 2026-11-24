import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useReducer } from "react";
import { Text, YStack } from "tamagui";
import { AppThoughtBubble } from "../../../shared/components";
import { moodFlowTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { moodHistoryOptions, partnerMoodOptions } from "../moodQueries";
import { moodService } from "../moodService";
import { recentProfileMood } from "../moodHistoryModel";
import { MoodAttachments, moodDisplayLabel } from "./MoodCheckInDetails";

export function ServerMoodProfileBubble({ partner = false, enabled, available = true }: { partner?: boolean; enabled: boolean; available?: boolean }) {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const own = useInfiniteQuery({ ...moodHistoryOptions({ accountId, sessionId }, moodService.history), enabled: enabled && Boolean(accountId) && !partner });
  const other = useQuery({ ...partnerMoodOptions({ accountId, coupleId, sessionId }, moodService.partner), enabled: enabled && Boolean(accountId && coupleId) && partner });
  const query = partner ? other : own;
  const candidate = partner && available && coupleId && other.data?.partner_id && other.data.partner_id !== accountId ? other.data.latest_mood : null;
  const mood = recentProfileMood(partner ? candidate && !candidate.is_private && candidate.share_level !== "private" ? [candidate] : [] : own.data?.pages.flat() ?? []);
  const [, expire] = useReducer((version: number) => version + 1, 0);
  const expiresAt = mood ? Date.parse(mood.created_at) + 24 * 60 * 60 * 1000 : null;
  useEffect(() => {
    if (expiresAt === null) return;
    const timer = setTimeout(expire, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);
  const full = mood && (mood.share_level === "all" || !partner);
  const initialLoading = enabled && available && Boolean(accountId && (!partner || coupleId)) && query.isPending;
  return <AppThoughtBubble density="compact" fitContent>
    <YStack maxWidth="100%" alignItems="center" gap="$xs">
      {mood ? <>
        <Text fontFamily="$body" fontSize="$label" lineHeight="$label" fontWeight="$semibold" color="$accentText" textAlign="center" numberOfLines={1}>{moodDisplayLabel(mood)}</Text>
        {full && mood.note?.trim() ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary" textAlign="center" numberOfLines={2}>{mood.note}</Text> : null}
        {full && mood.attachments?.length ? <MoodAttachments mood={mood} size={moodFlowTokens.profileAttachmentSize} /> : null}
      </> : <Text fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color="$textSecondary" textAlign="center" numberOfLines={3}>{getMessage("vi", available && query.isError && !query.data ? "moodHistoryReadError" : initialLoading ? "moodHistoryLoading" : "moodHomeNoteEmpty")}</Text>}
    </YStack>
  </AppThoughtBubble>;
}
