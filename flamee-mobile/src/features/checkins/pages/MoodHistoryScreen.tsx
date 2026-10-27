import { ChevronLeft } from "@tamagui/lucide-icons-2/icons/ChevronLeft";
import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { CalendarDays } from "@tamagui/lucide-icons-2/icons/CalendarDays";
import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppCalendarDay, AppCalendarGrid, AppGradientText, AppIconButton, AppScreen, AppTextButton, SectionCard, useAppHeader } from "../../../shared/components";
import { featureTokens, memoryCalendarTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { moodCalendarCells, moodCalendarDay, moveMoodPeriod } from "../moodCalendarModel";
import { useRouter } from "expo-router";
import { latestMoodByDay, type MoodHistoryRecord } from "../moodHistoryModel";
import { MoodEmojiIcon } from "../components/MoodEmojiIcon";
import { resolveEmotionDefinition } from "../emotionCatalog";
import { resolveCheckInFeeling } from "../checkInFeelingCatalog";
import { moodPreviewRecords } from "../moodPreviewData";

const monthFormat = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const atDay = (day: string) => new Date(`${day}T12:00:00Z`);

export function MoodHistoryScreen({ records = moodPreviewRecords }: { records?: readonly MoodHistoryRecord[] }) {
  const router = useRouter();
  useAppHeader({ title: getMessage("vi", "moodHistoryTitle"), showBack: true });
  const today = moodCalendarDay(new Date());
  const latestPreviewDay = records.reduce((latest, record) => record.day > latest ? record.day : latest, "");
  const [anchor, setAnchor] = useState(latestPreviewDay || today);
  const [selected, setSelected] = useState(latestPreviewDay || today);
  const days = moodCalendarCells(anchor, "month");
  const next = moveMoodPeriod(anchor, "month", 1);
  const nextStart = moodCalendarCells(next, "month").find((day) => day !== null);
  const title = monthFormat.format(atDay(anchor));
  const moods = latestMoodByDay(records);
  const selectedMood = moods.get(selected);
  const selectedEmotion = selectedMood ? resolveCheckInFeeling(selectedMood.emotionId) ?? resolveEmotionDefinition(selectedMood.emotionId) : null;
  const shift = (direction: number) => { setAnchor(moveMoodPeriod(anchor, "month", direction)); setSelected(""); };
  return <AppScreen contentProps={{ width: "100%", maxWidth: featureTokens.maxWidth, alignSelf: "center" }}>
    <XStack alignItems="center" justifyContent="space-between">
      <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "moodPeriodPrevious")} icon={<ChevronLeft size={22} color="$textPrimary" />} onPress={() => shift(-1)} />
      <AppTextButton onPress={() => { setAnchor(today); setSelected(today); }}>{getMessage("vi", "moodToday")}</AppTextButton>
      <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "moodPeriodNext")} disabled={!nextStart || nextStart > today} icon={<ChevronRight size={22} color="$textPrimary" />} onPress={() => shift(1)} />
    </XStack>
    <SectionCard tone="white">
      <XStack alignItems="center" justifyContent="space-between">
        <AppGradientText flex={1} size="h4" weight="bold" aria-live="polite">{title}</AppGradientText>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{String(atDay(anchor).getUTCMonth() + 1).padStart(2, "0")}</Text>
      </XStack>
      <AppCalendarGrid cells={days.map((day, index) => {
        const mood = day ? moods.get(day) : undefined;
        const emotion = mood ? resolveCheckInFeeling(mood.emotionId) ?? resolveEmotionDefinition(mood.emotionId) : null;
        const label = day ? mood && emotion
          ? `${fullDate.format(atDay(day))}. ${getMessage("vi", emotion.labelKey)}`
          : formatMessage("vi", "moodHistoryNoDataLabel", { date: fullDate.format(atDay(day)) }) : "";
        return { key: day ?? `blank-${index}`, content: day ? <AppCalendarDay variant="mood" showDayNumber selected={selected === day} day={Number(day.slice(-2))} label={label} today={day === today} future={day > today} count={0}
          moodIcon={mood ? <MoodEmojiIcon emotionId={mood.emotionId} size={memoryCalendarTokens.moodIconSize} /> : undefined} onPress={() => setSelected(day)} /> : <YStack height={memoryCalendarTokens.cellHeight} /> };
      })} />
    </SectionCard>
    <YStack gap="$md" paddingVertical="$lg" alignItems="center">
      {records.length === 0 ? <>
        <CalendarDays size={28} color="$textSecondary" aria-hidden />
        <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary" textAlign="center">{getMessage("vi", "moodHistoryUnavailable")}</Text>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" textAlign="center">{getMessage("vi", "moodHistoryUnavailableBody")}</Text>
      </> : null}
      {selected ? <YStack alignSelf="stretch" gap="$xs" paddingTop="$lg" borderTopWidth={1} borderColor="$border">
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{fullDate.format(atDay(selected))}</Text>
        {selectedMood ? <XStack alignItems="center" gap="$sm">
          <MoodEmojiIcon emotionId={selectedMood.emotionId} size={32} label={selectedEmotion ? getMessage("vi", selectedEmotion.labelKey) : undefined} />
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{selectedEmotion ? getMessage("vi", selectedEmotion.labelKey) : selectedMood.emotionId}</Text>
        </XStack> : <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "moodHistoryDayUnavailable")}</Text>}
      </YStack> : null}
      <AppButton fill onPress={() => router.push("/mood/check-in")}>{getMessage("vi", "moodStartCheckIn")}</AppButton>
    </YStack>
  </AppScreen>;
}
