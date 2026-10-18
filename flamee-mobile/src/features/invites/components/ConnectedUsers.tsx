import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { useEffect, useState } from "react";
import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { colors, inviteSceneTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import type { AcceptedCouple, ConnectionMember } from "../inviteApi";
import { orderConnectedMembers } from "../joinInviteFlow";

function Portrait({ member }: { member: ConnectionMember | null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [member?.avatar_url]);
  const size = inviteSceneTokens.portraitSize;
  const initials = member?.full_name.trim().split(/\s+/).slice(-2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  return <YStack flex={1} minWidth={0} maxWidth={132} alignItems="center" gap="$md">
    <YStack width={size} height={size} borderRadius={size / 2} backgroundColor={member ? "$accentSoft" : "$surfaceMuted"} alignItems="center" justifyContent="center" overflow="hidden">
      {member?.avatar_url && !failed ? <Image source={{ uri: member.avatar_url }} resizeMode="cover" onError={() => setFailed(true)} style={{ width: size, height: size }} accessible={false} />
        : member ? <Text fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$accentText">{initials}</Text> : null}
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
    <Text fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary" textAlign="center">{getMessage("vi", "connectionPairedTitle")}</Text>
  </YStack>;
}
