import { AppGradientText, AppProfileAvatar } from "../../../shared/components";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { Text, XStack, YStack } from "tamagui";
import { colors, inviteSceneTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import type { AcceptedCouple, ConnectionMember } from "../inviteApi";
import { orderConnectedMembers } from "../joinInviteFlow";

function Portrait({ member }: { member: ConnectionMember | null }) {
  const size = inviteSceneTokens.portraitSize;
  return <YStack flex={1} minWidth={0} maxWidth={132} alignItems="center" gap="$md">
    <YStack width={size} height={size} borderRadius={size / 2} backgroundColor={member ? "$accentSoft" : "$surfaceMuted"} alignItems="center" justifyContent="center" overflow="hidden">
      {member ? <AppProfileAvatar uri={member.avatar_url} fallbackSeed={member.id} size={size} accessibilityLabel={member.full_name} /> : null}
    </YStack>
    {member ? <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$semibold" color="$textPrimary" textAlign="center" numberOfLines={2}>{member.full_name}</Text>
      : <YStack width={72} height={12} borderRadius="$sm" backgroundColor="$surfaceMuted" aria-hidden={true} />}
  </YStack>;
}

export function ConnectedUsers({ couple, accountId }: { couple: AcceptedCouple | null; accountId: string }) {
  const members = couple ? orderConnectedMembers(couple, accountId) : null;
  return <YStack width="100%" maxWidth={380} alignItems="center" gap="$xl">
    <XStack width="100%" alignItems="flex-start" justifyContent="center" gap="$xs">
      <Portrait member={members?.[0] ?? null} />
      <XStack height={inviteSceneTokens.portraitSize} alignItems="center" justifyContent="center">
        <YStack width={10} height={1} backgroundColor="$supportPeach" />
        <YStack width={36} height={36} borderRadius={18} backgroundColor="$accentSoft" alignItems="center" justifyContent="center"><Heart size={19} color="$primary" fill={colors.primary} aria-hidden={true} /></YStack>
        <YStack width={10} height={1} backgroundColor="$supportPeach" />
      </XStack>
      <Portrait member={members?.[1] ?? null} />
    </XStack>
    <AppGradientText fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary" textAlign="center">{getMessage("vi", "connectionPairedTitle")}</AppGradientText>
  </YStack>;
}
