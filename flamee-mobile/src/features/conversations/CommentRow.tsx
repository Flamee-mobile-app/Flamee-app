import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { Text, XStack, YStack } from "tamagui";
import { AppProfileAvatar, AppTextButton } from "../../shared/components";
import { formatMessage, getMessage } from "../../shared/localization/messages";
import type { MemoryComment } from "./conversationApi";
import { colors } from "../../shared/constants/tokens";

export function CommentRow({ comment, own, busy, onReply, onEdit, onDelete, onHeart, highlighted }: {
  comment: MemoryComment; own: boolean; busy: boolean; highlighted: boolean;
  onReply: () => void; onEdit: () => void; onDelete: () => void; onHeart: () => void;
}) {
  const c = comment;
  return <YStack gap="$sm" padding="$md" marginLeft={c.parent_id ? "$lg" : 0} borderRadius="$lg" backgroundColor={highlighted ? "$accentSoft" : "transparent"}>
    {c.parent_id ? <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{formatMessage("vi", "conversationReplyTo", { name: c.parent_author ?? "…" })}</Text> : null}
    <XStack gap="$sm" alignItems="center">
      <AppProfileAvatar fallbackSeed={c.author.id} size={28} accessibilityLabel={c.author.full_name} />
      <Text flex={1} fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold" color="$textPrimary">{c.author.username || c.author.full_name}</Text>
      <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{new Date(c.created_at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
    </XStack>
    <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color={c.deleted ? "$textSecondary" : "$textPrimary"}>{c.deleted ? getMessage("vi", "conversationDeleted") : c.body}</Text>
    {!c.deleted && c.version > 0 ? <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "conversationEdited")}</Text> : null}
    {!c.deleted ? <XStack gap="$md" flexWrap="wrap" alignItems="center">
      <AppTextButton disabled={busy} accessibilityLabel={getMessage("vi", c.hearted ? "conversationUnheart" : "conversationHeart")} icon={<Heart size={18} color={c.hearted ? "$primary" : "$textSecondary"} fill={c.hearted ? colors.primary : "none"} />} onPress={onHeart}>{String(c.heart_count)}</AppTextButton>
      {!c.parent_id ? <AppTextButton disabled={busy} onPress={onReply}>{getMessage("vi", "conversationReply")}</AppTextButton> : null}
      {own ? <><AppTextButton disabled={busy} onPress={onEdit}>{getMessage("vi", "conversationEdit")}</AppTextButton><AppTextButton disabled={busy} onPress={onDelete}>{getMessage("vi", "conversationDelete")}</AppTextButton></> : null}
    </XStack> : null}
  </YStack>;
}
