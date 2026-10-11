import { Modal, StyleSheet, View } from "react-native";
import { ScrollView, Text, YStack } from "tamagui";
import { AppButton } from "../../../shared/components";
import { colors, spacing } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import type { PairingNotice } from "../../invites";
import { InviteGiftPreview } from "../../invites/screens";

export function PairingNoticeModal({ notice, onClose }: { notice: PairingNotice | null; onClose: () => void }) {
  return <Modal visible={Boolean(notice)} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.overlay}>
      <YStack width="100%" maxWidth={400} maxHeight="85%" borderRadius="$xl" backgroundColor="$background" overflow="hidden" role="dialog" aria-modal={true} aria-label={getMessage("vi", "connectedTitle")}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <Text id="pairing-notice-title" role="heading" aria-level={1} fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" textAlign="center">{getMessage("vi", "connectedTitle")}</Text>
        <Text fontFamily="$body" fontSize="$bodyM" textAlign="center">{formatMessage("vi", "pairingNoticeBody", { name: notice?.partnerName || getMessage("vi", "partnerGenericName") })}</Text>
        {notice?.greeting ? <YStack padding="$lg" borderRadius="$lg" backgroundColor="$supportPeachLight" gap="$sm">
          <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{formatMessage("vi", "greetingFromPartner", { name: notice.partnerName || getMessage("vi", "partnerGenericName") })}</Text>
          <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL">{notice.greeting}</Text>
        </YStack> : <Text textAlign="center" color="$textSecondary">{getMessage("vi", "pairingBrandWish")}</Text>}
        <InviteGiftPreview gift={notice?.gift ?? null} />
        <AppButton onPress={onClose}>{getMessage("vi", "continueHome")}</AppButton>
        </ScrollView>
      </YStack>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: colors.textPrimary + "88" } });
