import { Text, YStack } from "tamagui";
import { AppButton, AppDialog, SectionCard } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import type { PairingNotice } from "../../invites";
import { InviteGiftPreview } from "../../invites/screens";

export function PairingNoticeModal({ notice, onClose }: { notice: PairingNotice | null; onClose: () => void }) {
  return (
    <AppDialog open={Boolean(notice)} onOpenChange={(next) => { if (!next) onClose(); }}
      title={getMessage("vi", "connectedTitle")}
      description={formatMessage("vi", "pairingNoticeBody", { name: notice?.partnerName || getMessage("vi", "partnerGenericName") })}>
      {notice?.greeting ? <SectionCard tone="peach">
        <YStack gap="$sm">
          <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{formatMessage("vi", "greetingFromPartner", { name: notice.partnerName || getMessage("vi", "partnerGenericName") })}</Text>
          <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" color="$textPrimary">{notice.greeting}</Text>
        </YStack>
      </SectionCard> : <Text textAlign="center" color="$textSecondary">{getMessage("vi", "pairingBrandWish")}</Text>}
      <InviteGiftPreview gift={notice?.gift ?? null} />
      <AppButton onPress={onClose}>{getMessage("vi", "continueHome")}</AppButton>
    </AppDialog>
  );
}
