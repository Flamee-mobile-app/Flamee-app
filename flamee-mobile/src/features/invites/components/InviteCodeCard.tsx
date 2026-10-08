import { Clock3, Copy, Share2 } from "@tamagui/lucide-icons-2";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, SectionCard } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";

type InviteCodeCardProps = {
  code: string;
  expiresLabel: string;
  onShare: () => void;
  onRecreate: () => void;
};

export function InviteCodeCard({ code, expiresLabel, onShare, onRecreate }: InviteCodeCardProps) {
  return (
    <SectionCard tone="peach">
      <YStack alignItems="center" gap="$sm">
        <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">
          {getMessage("vi", "inviteCodeLabel")}
        </Text>
        <Text letterSpacing={6} fontFamily="$heading" fontSize="$h2" fontWeight="$bold" color="$textPrimary">
          {code}
        </Text>
        <XStack alignItems="center" gap="$xs">
          <Clock3 size={16} color="$textSecondary" />
          <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{expiresLabel}</Text>
        </XStack>
      </YStack>
      <AppButton icon={<Share2 size={18} />} onPress={onShare}>{getMessage("vi", "shareInvite")}</AppButton>
      <AppButton variant="ghost" icon={<Copy size={18} />} onPress={onRecreate}>{getMessage("vi", "recreateInvite")}</AppButton>
    </SectionCard>
  );
}
