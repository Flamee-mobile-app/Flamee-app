import { useInfiniteQuery } from "@tanstack/react-query";
import { Text, YStack } from "tamagui";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { getMessage } from "../../../shared/localization/messages";
import { moodHistoryOptions } from "../moodQueries";
import { moodService } from "../moodService";
import { moodHistoryRecords } from "../moodHistoryModel";
import { MoodWeekPreview } from "./MoodWeekPreview";

export function ServerMoodWeek({ onOpen }: { onOpen: () => void }) {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const query = useInfiniteQuery({ ...moodHistoryOptions({ accountId, sessionId }, moodService.history), enabled: Boolean(accountId) });
  return <YStack gap="$sm">
    <MoodWeekPreview onOpen={onOpen} records={moodHistoryRecords(query.data?.pages.flat() ?? [])} />
    <Text role={query.isError ? "alert" : undefined} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">
      {getMessage("vi", query.isError ? "moodHistoryReadError" : query.isPending ? "moodHistoryLoading" : "moodHistoryPartial")}
    </Text>
  </YStack>;
}
