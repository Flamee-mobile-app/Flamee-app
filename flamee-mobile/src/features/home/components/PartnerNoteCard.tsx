import { MessageCircle } from "@tamagui/lucide-icons-2/icons/MessageCircle";
import { Text, XStack, YStack } from "tamagui";
import { SectionCard } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import type { PartnerNotePreview } from "../homePresentationModel";

export function PartnerNoteCard({ partnerName, preview, onOpen }: { partnerName: string; preview: PartnerNotePreview | null; onOpen: () => void }) {
  return (
    <YStack gap="$md">
      <Text role="heading" aria-level={2} fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">
        {getMessage("vi", "homeConnectionTitle")}
      </Text>
      {preview ? (
        <SectionCard accessibilityLabel={getMessage("vi", "openPartnerNote")} onPress={onOpen}>
          <XStack alignItems="center" gap="$sm">
            <MessageCircle size={18} color="$accentText" />
            <Text flex={1} fontFamily="$body" fontSize="$bodyS" fontWeight="$semibold" color="$accentText">
              {formatMessage("vi", "homeNoteFrom", { name: partnerName })}
            </Text>
          </XStack>
          <Text fontFamily="$heading" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$medium" color="$textPrimary" numberOfLines={2}>
            “{preview.note}”
          </Text>
        </SectionCard>
      ) : (
        <SectionCard>
          <Text fontFamily="$heading" fontSize="$bodyL" fontWeight="$medium" color="$textPrimary">{getMessage("vi", "partnerNoUpdate")}</Text>
          <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{formatMessage("vi", "partnerNoUpdateBody", { name: partnerName })}</Text>
        </SectionCard>
      )}
    </YStack>
  );
}
