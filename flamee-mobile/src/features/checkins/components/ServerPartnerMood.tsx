import { useQuery } from "@tanstack/react-query";
import { Text, YStack } from "tamagui";
import { AppButton } from "../../../shared/components";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { getMessage } from "../../../shared/localization/messages";
import { partnerMoodOptions } from "../moodQueries";
import { moodService } from "../moodService";
import { resolveCheckInFeeling } from "../checkInFeelingCatalog";
import { resolveEmotionDefinition } from "../emotionCatalog";

export function ServerPartnerMood() {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const coupleId = useSessionStore((state) => state.activeCoupleId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const query = useQuery({ ...partnerMoodOptions({ accountId, coupleId, sessionId }, moodService.partner), enabled: Boolean(accountId && coupleId) });
  const mood = query.data?.latest_mood;
  const feeling = mood ? resolveCheckInFeeling(mood.mood) ?? resolveEmotionDefinition(mood.mood) : null;
  return <YStack gap="$md" alignSelf="stretch">
    <Text role={query.isError ? "alert" : undefined} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">
      {query.isError ? getMessage("vi", "moodHistoryReadError") : !coupleId ? getMessage("vi", "partnerMoodEmpty") : query.isPending ? getMessage("vi", "moodHistoryLoading") : mood ? feeling ? getMessage("vi", feeling.labelKey) : mood.mood : getMessage("vi", "partnerMoodEmpty")}
    </Text>
    {mood ? <>
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{new Date(mood.created_at).toLocaleString("vi-VN")}</Text>
      {mood.share_level === "all" && mood.note ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{mood.note}</Text> : null}
      {mood.share_level === "all" && mood.reasons?.length ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{mood.reasons.join(", ")}</Text> : null}
    </> : null}
    <AppButton variant="ghost" disabled={!accountId || !coupleId} loading={query.isFetching} onPress={() => { void query.refetch(); }}>{getMessage("vi", "retry")}</AppButton>
  </YStack>;
}
