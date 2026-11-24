import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { Text, XStack, YStack } from "tamagui";
import { AppContextMenuTrigger, AppProfileAvatar, AppTextButton } from "../../shared/components";
import { formatMessage, getMessage } from "../../shared/localization/messages";
import type { MemoryComment } from "./conversationApi";
import { colors } from "../../shared/constants/tokens";
import type { PopupAnchor } from "../../shared/components/anchoredPopupModel";
import { getCommentAuthorName } from "./conversationModel";

export function CommentRow({ comment, busy, onOpenActions, onHeart, onReply, highlighted, lastReply, parentName }: {
  comment: MemoryComment; busy: boolean; highlighted: boolean; lastReply: boolean;
  parentName: string;
  onOpenActions: (anchor: PopupAnchor) => void; onHeart: () => void; onReply: () => void;
}) {
  const c = comment;
  const authorName = getCommentAuthorName(c.author);
  return <YStack position="relative" paddingLeft={c.parent_id ? "$xxl" : 0} paddingBottom={c.parent_id ? "$sm" : "$md"}>
    {c.parent_id ? <>
      <YStack position="absolute" left="$md" top={0} height={lastReply ? 30 : "100%"} width={2} backgroundColor="$border" pointerEvents="none" />
      <YStack position="absolute" left="$md" top={28} width={16} height={2} backgroundColor="$border" pointerEvents="none" />
    </> : null}
    <AppContextMenuTrigger surfaceTone={highlighted ? "highlighted" : "default"} disabled={busy || c.deleted} onOpen={onOpenActions} label={`${authorName}: ${c.deleted ? getMessage("vi", "conversationDeleted") : c.body}`}>
    <YStack gap="$sm" padding="$md">
    {c.parent_id ? <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{formatMessage("vi", "conversationReplyTo", { name: parentName })}</Text> : null}
    <XStack gap="$sm" alignItems="center">
      <AppProfileAvatar fallbackSeed={c.author.id} size={28} accessibilityLabel={authorName} />
      <Text flex={1} fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold" color="$textPrimary">{authorName}</Text>
      <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{new Date(c.created_at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
    </XStack>
    <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color={c.deleted ? "$textSecondary" : "$textPrimary"}>{c.deleted ? getMessage("vi", "conversationDeleted") : c.body}</Text>
    {!c.deleted && c.version > 0 ? <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "conversationEdited")}</Text> : null}
    </YStack>
    </AppContextMenuTrigger>
    {!c.deleted ? <XStack paddingHorizontal="$md" alignItems="center" justifyContent="space-between">
      <AppTextButton size="compact" disabled={busy} accessibilityLabel={getMessage("vi", c.hearted ? "conversationUnheart" : "conversationHeart")} icon={<Heart size={18} color={c.hearted ? "$primary" : "$textSecondary"} fill={c.hearted ? colors.primary : "none"} />} onPress={onHeart}>{String(c.heart_count)}</AppTextButton>
      {!c.parent_id ? <AppTextButton size="compact" disabled={busy} onPress={onReply}>{getMessage("vi", "conversationReply")}</AppTextButton> : null}
    </XStack> : null}
  </YStack>;
}
