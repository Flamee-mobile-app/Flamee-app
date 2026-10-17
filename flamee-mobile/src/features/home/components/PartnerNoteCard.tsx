import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { MessageCircle } from "@tamagui/lucide-icons-2/icons/MessageCircle";
import { Text, XStack, YStack } from "tamagui";
import { homeShadows } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import type { PartnerNotePreview } from "../homePresentationModel";

export function PartnerNoteCard({ partnerName, preview, onOpen }: { partnerName: string; preview: PartnerNotePreview | null; onOpen: () => void }) {
  return (
    <YStack gap="$md">
      <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">
        {getMessage("vi", "homeConnectionTitle")}
      </Text>
      {preview ? (
        <YStack
          backgroundColor="$surface"
          borderRadius="$xl"
          padding="$lg"
          gap="$md"
          role="button"
          aria-label={getMessage("vi", "openPartnerNote")}
          onPress={onOpen}
          pressStyle={{ opacity: 0.78 }}
          {...homeShadows.card}
        >
          <XStack alignItems="center" gap="$sm">
            <MessageCircle size={18} color="$accentText" />
            <Text flex={1} fontFamily="$body" fontSize="$bodyS" fontWeight="$semibold" color="$accentText">
              {formatMessage("vi", "homeNoteFrom", { name: partnerName })}
            </Text>
            <ChevronRight size={18} color="$textSecondary" />
          </XStack>
          <Text fontFamily="$heading" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$medium" color="$textPrimary" numberOfLines={2}>
            “{preview.note}”
          </Text>
        </YStack>
      ) : (
        <YStack backgroundColor="$surface" borderRadius="$xl" padding="$lg" gap="$xs" {...homeShadows.card}>
          <Text fontFamily="$heading" fontSize="$bodyL" fontWeight="$medium" color="$textPrimary">{getMessage("vi", "partnerNoUpdate")}</Text>
          <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{formatMessage("vi", "partnerNoUpdateBody", { name: partnerName })}</Text>
        </YStack>
      )}
    </YStack>
  );
}
