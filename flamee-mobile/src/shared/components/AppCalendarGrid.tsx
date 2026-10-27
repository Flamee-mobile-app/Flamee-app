import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";
import { memoryCalendarTokens } from "../constants/tokens";

/** Shared seven-column layout; the feature owns the meaning of each day. */
export function AppCalendarGrid({ cells, density = "default" }: { cells: readonly { key: string; content: ReactNode }[]; density?: "default" | "compact" }) {
  const rows = Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => cells.slice(row * 7, row * 7 + 7));
  return <YStack gap={density === "compact" ? "$xs" : "$lg"}>
    <XStack gap={memoryCalendarTokens.cellGap}>{memoryCalendarTokens.weekdays.map((day) => <YStack key={day} flex={1} flexBasis={0} minWidth={0} alignItems="center"><Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" fontWeight="$semibold" color="$textSecondary">{day}</Text></YStack>)}</XStack>
    <YStack gap={memoryCalendarTokens.cellGap}>{rows.map((row, index) => <XStack key={index} gap={memoryCalendarTokens.cellGap}>
      {row.map((cell) => <YStack key={cell.key} flex={1} flexBasis={0} minWidth={0}>{cell.content}</YStack>)}
    </XStack>)}</YStack>
  </YStack>;
}
