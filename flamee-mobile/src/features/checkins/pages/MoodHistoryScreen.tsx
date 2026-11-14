import { ChevronLeft } from "@tamagui/lucide-icons-2/icons/ChevronLeft";
import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { CalendarDays } from "@tamagui/lucide-icons-2/icons/CalendarDays";
import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppCalendarDay, AppCalendarGrid, AppGradientText, AppIconButton, AppScreen, AppTextButton, SectionCard, useAppHeader } from "../../../shared/components";
import { featureTokens, memoryCalendarTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { moodCalendarCells, moodCalendarDay, moveMoodPeriod } from "../moodCalendarModel";
import { useRouter } from "expo-router";
import { latestMoodByDay, type MoodHistoryRecord } from "../moodHistoryModel";
import { ServerMoodIcon as MoodEmojiIcon } from "../components/ServerMoodIcon";
import { resolveEmotionDefinition } from "../emotionCatalog";
import { resolveCheckInFeeling } from "../checkInFeelingCatalog";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { moodHistoryOptions } from "../moodQueries";
import { moodService } from "../moodService";
import { moodHistoryRecords } from "../moodHistoryModel";

const monthFormat = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const atDay = (day: string) => new Date(`${day}T12:00:00Z`);

export function MoodHistoryScreen() {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const sessionId = useSessionStore((state) => state.sessionId);
  return <ServerMoodHistory key={`${sessionId}:${accountId}`} accountId={accountId} sessionId={sessionId} />;
}

function ServerMoodHistory({ accountId, sessionId }: { accountId: string | null; sessionId: number }) {
  const query = useInfiniteQuery({ ...moodHistoryOptions({ accountId, sessionId }, moodService.history), enabled: Boolean(accountId) });
  const records = useMemo(() => moodHistoryRecords(query.data?.pages.flat() ?? []), [query.data]);
  return <MoodHistoryCalendar records={records} status={query.isError ? "error" : query.data ? "ready" : "loading"}
    busy={query.isFetching} hasMore={Boolean(query.hasNextPage)} onRefresh={() => { void query.refetch(); }} onMore={() => { void query.fetchNextPage(); }} />;
}

function MoodHistoryCalendar({ records, status, busy, hasMore, onRefresh, onMore }: { records: readonly MoodHistoryRecord[]; status: "loading" | "error" | "ready"; busy: boolean; hasMore: boolean; onRefresh: () => void; onMore: () => void }) {
  const router = useRouter();
  useAppHeader({ title: getMessage("vi", "moodHistoryTitle"), showBack: true });
  const today = moodCalendarDay(new Date());
  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);
  const days = moodCalendarCells(anchor, "month");
  const next = moveMoodPeriod(anchor, "month", 1);
  const nextStart = moodCalendarCells(next, "month").find((day) => day !== null);
  const title = monthFormat.format(atDay(anchor));
  const moods = latestMoodByDay(records);
  const selectedMood = moods.get(selected);
  const selectedEmotion = selectedMood ? resolveCheckInFeeling(selectedMood.emotionId) ?? resolveEmotionDefinition(selectedMood.emotionId) : null;
  const shift = (direction: number) => { setAnchor(moveMoodPeriod(anchor, "month", direction)); setSelected(""); };
  return <AppScreen contentProps={{ width: "100%", maxWidth: featureTokens.maxWidth, alignSelf: "center" }}>
    {status !== "ready" ? <Text role={status === "error" ? "alert" : undefined} fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", status === "error" ? "moodHistoryReadError" : "moodHistoryLoading")}</Text> : null}
    <AppButton variant="ghost" loading={busy} onPress={onRefresh}>{getMessage("vi", "moodHistoryRefresh")}</AppButton>
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
        const label = day ? mood
          ? `${fullDate.format(atDay(day))}. ${emotion ? getMessage("vi", emotion.labelKey) : mood.emotionId}`
          : formatMessage("vi", "moodHistoryNoDataLabel", { date: fullDate.format(atDay(day)) }) : "";
        return { key: day ?? `blank-${index}`, content: day ? <AppCalendarDay variant="mood" showDayNumber selected={selected === day} day={Number(day.slice(-2))} label={label} today={day === today} future={day > today} count={0}
          moodIcon={mood ? <MoodEmojiIcon emotionId={mood.emotionId} size={memoryCalendarTokens.moodIconSize} /> : undefined} onPress={() => setSelected(day)} /> : <YStack height={memoryCalendarTokens.cellHeight} /> };
      })} />
    </SectionCard>
    <YStack gap="$md" paddingVertical="$lg" alignItems="center">
      {status === "ready" && records.length === 0 ? <>
        <CalendarDays size={28} color="$textSecondary" aria-hidden />
        <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary" textAlign="center">{getMessage("vi", "moodHistoryEmpty")}</Text>
      </> : null}
      {selected && (records.length > 0 || status === "ready") ? <YStack alignSelf="stretch" gap="$xs" paddingTop="$lg" borderTopWidth={1} borderColor="$border">
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{fullDate.format(atDay(selected))}</Text>
        {selectedMood ? <XStack alignItems="center" gap="$sm">
          <MoodEmojiIcon emotionId={selectedMood.emotionId} size={32} label={selectedEmotion ? getMessage("vi", selectedEmotion.labelKey) : undefined} />
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{selectedEmotion ? getMessage("vi", selectedEmotion.labelKey) : selectedMood.emotionId}</Text>
        </XStack> : <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "moodHistoryDayUnavailable")}</Text>}
      </YStack> : null}
      {hasMore ? <>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "moodHistoryPartial")}</Text>
        <AppButton variant="secondary" loading={busy} onPress={onMore}>{getMessage("vi", "moodHistoryMore")}</AppButton>
      </> : null}
      <AppButton fill onPress={() => router.push("/mood/check-in")}>{getMessage("vi", "moodStartCheckIn")}</AppButton>
    </YStack>
  </AppScreen>;
}
