import { Image, StyleSheet } from "react-native";
import { Text } from "tamagui";
import { AppButton, AppSheet } from "../../../shared/components";
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
    <AppSheet open={visible} onOpenChange={(next) => { if (!next) onClose(); }}
      title={formatMessage("vi", "partnerNoteTitle", { name: partnerName })} description={formattedTime}>
      {sticker ? <Image source={sticker.source()} style={styles.mascot} resizeMode="contain" accessible accessibilityLabel={getMessage("vi", sticker.labelKey)} /> : null}
      <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$medium" color="$textPrimary">“{note}”</Text>
      {hasNudge ? <AppButton onPress={onDoNudge}>{getMessage("vi", "nudgeDoNow")}</AppButton> : null}
    </AppSheet>
  );
}

const styles = StyleSheet.create({ mascot: { width: 144, height: 144, alignSelf: "center" } });
