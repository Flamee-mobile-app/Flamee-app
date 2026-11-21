import type { ReactNode } from "react";
import { Button, Text, XStack, YStack } from "tamagui";

/** Flat, full-width inbox row; read state is never inferred from presentation. */
export function AppNotificationRow({ label, timestamp, unread, unreadLabel, icon, disabled, onPress }: { label: string; timestamp: string; unread: boolean; unreadLabel: string; icon: ReactNode; disabled?: boolean; onPress: () => void }) {
  return <Button unstyled width="100%" minHeight={76} paddingHorizontal="$lg" paddingVertical="$md" borderWidth={0} borderRadius={0}
    backgroundColor={unread ? "$supportPeachLight" : "transparent"} pressStyle={{ opacity: 0.8 }}
    disabled={disabled} onPress={onPress} role="button" aria-label={`${label}, ${timestamp}${unread ? `, ${unreadLabel}` : ""}`} aria-disabled={disabled}>
    <XStack width="100%" minWidth={0} alignItems="center" gap="$md" pointerEvents="none">
      {icon}
      <YStack flex={1} minWidth={0} gap="$xs">
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight={unread ? "$semibold" : "$regular"} color="$textPrimary">{label}</Text>
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{timestamp}</Text>
      </YStack>
      {unread ? <YStack width={8} height={8} borderRadius={4} backgroundColor="$primary" /> : null}
    </XStack>
  </Button>;
}
