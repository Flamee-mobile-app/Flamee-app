import { Flag } from "@tamagui/lucide-icons-2/icons/Flag";
import { Flame } from "@tamagui/lucide-icons-2/icons/Flame";
import { Gift } from "@tamagui/lucide-icons-2/icons/Gift";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { Images } from "@tamagui/lucide-icons-2/icons/Images";
import { Plane } from "@tamagui/lucide-icons-2/icons/Plane";
import { memo } from "react";
import Svg, { Path } from "react-native-svg";
import { Text, XStack, YStack } from "tamagui";
import { AppCalendarDay, AppCalendarGrid, SectionCard } from "../../../shared/components";
import { memoryCalendarTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import type { MemorySummary } from "../../moments";
import { getMemoryCalendarStats, type MemoryCalendarMonth } from "../memoryCalendarModel";

const specialIcons = { anniversary: Heart, first_date: Heart, milestone: Flag, gift: Gift, trip: Plane };
const monthFormatter = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric", timeZone: "UTC" });
const dayFormatter = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const MemoryCalendarMonthCard = memo(function MemoryCalendarMonthCard({ month, onDay, onAdd }: { month: MemoryCalendarMonth; onDay: (day: string, memories: MemorySummary[]) => void; onAdd: () => void }) {
  const label = monthFormatter.format(new Date(Date.UTC(month.year, month.month - 1, 1)));
  return <SectionCard tone="white">
    <YStack gap="$lg">
      <XStack alignItems="center" justifyContent="space-between">
        <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{label}</Text>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{String(month.month).padStart(2, "0")}</Text>
      </XStack>
      <AppCalendarGrid cells={month.cells.map((cell, index) => ({ key: cell?.day ?? `blank-${index}`, content: cell ? (() => {
              const photo = cell.memories.find((memory) => memory.image_count > 0 && memory.thumbnail_url);
              const special = cell.memories.find((memory) => memory.category in specialIcons);
              const Icon = special ? specialIcons[special.category as keyof typeof specialIcons] : null;
              const date = dayFormatter.format(new Date(`${cell.day}T12:00:00Z`));
              return <AppCalendarDay day={cell.number} today={cell.today} future={cell.future} unloaded={cell.unloaded} uri={photo?.thumbnail_url} count={cell.imageCount}
                label={`${date}. ${cell.today ? getMessage("vi", "memoryCalendarToday") : ""} ${cell.imageCount ? formatMessage("vi", "memoryFeedPhotoCount", { count: cell.imageCount }) : ""} ${cell.unloaded ? getMessage("vi", "memoryCalendarUnloaded") : ""}`}
                sticker={Icon ? <Icon size={memoryCalendarTokens.stickerSize} color="$accentText" strokeWidth={2} aria-hidden={true} /> : undefined}
                onPress={photo ? () => onDay(cell.day, cell.memories) : cell.today ? onAdd : undefined} />;
            })() : <YStack height={memoryCalendarTokens.cellHeight} /> }))} />
    </YStack>
  </SectionCard>;
});

export function MemoryCalendarConnector() {
  return <YStack width="100%" height={memoryCalendarTokens.connectorHeight} flexShrink={0} alignItems="center" pointerEvents="none" accessible={false}>
    <Svg width={70} height={memoryCalendarTokens.connectorHeight} viewBox="0 0 70 48"><Path d="M 44 0 C 44 22 23 20 23 48" stroke={memoryCalendarTokens.connectorStroke} strokeOpacity={memoryCalendarTokens.connectorOpacity} strokeWidth={memoryCalendarTokens.connectorWidth} strokeDasharray="4 6" strokeLinecap="round" fill="none" /></Svg>
  </YStack>;
}

export function MemoryCalendarStats({ records, today, partial }: { records: readonly MemorySummary[]; today: string; partial: boolean }) {
  const stats = getMemoryCalendarStats(records, today, partial);
  return <YStack gap="$md" paddingTop="$xl" paddingBottom="$lg">
    <SectionCard tone="white"><XStack justifyContent="space-between" alignItems="center" gap="$lg">
      <XStack alignItems="center" gap="$sm"><Flame size={24} color="$accentText" /><YStack>
        <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{stats.streakIsLowerBound ? `${stats.streak}+` : stats.streak}</Text>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "memoryCalendarStreak")}</Text>
      </YStack></XStack>
      <XStack alignItems="center" gap="$sm"><Images size={24} color="$accentText" /><YStack>
        <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{stats.photoCount}</Text>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", partial ? "memoryCalendarLoadedPhotos" : "memoryCalendarTotalPhotos")}</Text>
      </YStack></XStack>
    </XStack></SectionCard>
    {partial ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" textAlign="center">{getMessage("vi", "memoryCalendarPartial")}</Text> : null}
  </YStack>;
}
