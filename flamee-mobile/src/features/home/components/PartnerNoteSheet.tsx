import { X } from "@tamagui/lucide-icons-2/icons/X";
import { Image, Modal, Pressable, StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppButton } from "../../../shared/components";
import { colors, spacing } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { isPartnerVisibleEmotionCheckIn, resolveMascotSticker, type PartnerVisibleCheckIn } from "../../checkins";

type PartnerNoteSheetProps = {
  visible: boolean;
  partnerName: string;
  checkIn: PartnerVisibleCheckIn | null;
  formattedTime: string;
  hasNudge: boolean;
  onClose: () => void;
  onDoNudge: () => void;
};

export function PartnerNoteSheet({ visible, partnerName, checkIn, formattedTime, hasNudge, onClose, onDoNudge }: PartnerNoteSheetProps) {
  const emotionCheckIn = checkIn && isPartnerVisibleEmotionCheckIn(checkIn) ? checkIn : null;
  const sticker = resolveMascotSticker(emotionCheckIn?.mascotStickerId);
  const note = emotionCheckIn?.note ?? (checkIn?.kind === "legacy" && checkIn.shareScope === "full" ? checkIn.note : "");
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={getMessage("vi", "close")}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <YStack backgroundColor="$surface" borderTopLeftRadius="$xl" borderTopRightRadius="$xl" padding="$xl" paddingBottom="$xxl" gap="$lg">
            <XStack alignItems="center" justifyContent="space-between" gap="$md">
              <YStack flex={1} gap="$xs">
                <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">{formatMessage("vi", "partnerNoteTitle", { name: partnerName })}</Text>
                <Text fontFamily="$body" fontSize="$caption" color="$textSecondary">{formattedTime}</Text>
              </YStack>
              <YStack width={48} height={48} borderRadius="$lg" alignItems="center" justifyContent="center" role="button" aria-label={getMessage("vi", "close")} onPress={onClose} pressStyle={{ opacity: 0.65 }}>
                <X size={22} color="$textPrimary" />
              </YStack>
            </XStack>
            {sticker ? <Image source={sticker.source()} style={styles.mascot} resizeMode="contain" accessible accessibilityLabel={getMessage("vi", sticker.labelKey)} /> : null}
            <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$medium" color="$textPrimary">“{note}”</Text>
            {hasNudge ? <AppButton onPress={onDoNudge}>{getMessage("vi", "nudgeDoNow")}</AppButton> : null}
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.textPrimary + "66" },
  sheet: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: spacing.sm },
  mascot: { width: 144, height: 144, alignSelf: "center" },
});
