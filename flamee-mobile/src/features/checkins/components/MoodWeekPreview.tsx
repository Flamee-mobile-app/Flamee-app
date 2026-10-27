import { YStack } from "tamagui";
import { AppCalendarDay, AppCalendarGrid, SectionCard } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { moodCalendarCells, moodCalendarDay } from "../moodCalendarModel";
import { latestMoodByDay, type MoodHistoryRecord } from "../moodHistoryModel";
import { ServerMoodIcon as MoodEmojiIcon } from "./ServerMoodIcon";
import { memoryCalendarTokens } from "../../../shared/constants/tokens";

/** Shared Memories grid with seven mood cells; unavailable is never a neutral mood. */
export function MoodWeekPreview({ onOpen, records = [] }: { onOpen: () => void; records?: readonly MoodHistoryRecord[] }) {
  const today = moodCalendarDay(new Date());
  const anchor = records.reduce((latest, record) => record.day > latest ? record.day : latest, "") || today;
  const days = moodCalendarCells(anchor, "week");
  const moods = latestMoodByDay(records);
  return <SectionCard tone="white" density="compact" emphasis="action" showChevron={false} onPress={onOpen} accessibilityLabel={getMessage("vi", "moodOpenHistory")}>
    <YStack paddingVertical="$sm" gap="$xs">
      <YStack aria-hidden><AppCalendarGrid density="compact" cells={days.map((day, index) => {
        const mood = day ? moods.get(day) : undefined;
        return { key: day ?? String(index), content: day ? <AppCalendarDay variant="mood" day={Number(day.slice(-2))} label={day} today={day === today} future={day > today} count={0}
          moodIcon={mood ? <MoodEmojiIcon emotionId={mood.emotionId} size={memoryCalendarTokens.moodIconSize} /> : undefined} /> : null };
      })} /></YStack>
    </YStack>
  </SectionCard>;
}
