import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { Reply } from "@tamagui/lucide-icons-2/icons/Reply";
import { Pencil } from "@tamagui/lucide-icons-2/icons/Pencil";
import { Trash2 } from "@tamagui/lucide-icons-2/icons/Trash2";
import { Text, YStack } from "tamagui";
import { AppButton, AppDialog } from "../../shared/components";
import type { PopupAnchor } from "../../shared/components/anchoredPopupModel";
import { getMessage } from "../../shared/localization/messages";
import type { MemoryComment } from "./conversationApi";
import { getCommentActions, getCommentAuthorName } from "./conversationModel";

export function CommentActionsMenu({ comment, anchor, accountId, onClose, onAction }: {
  comment: MemoryComment; anchor: PopupAnchor; accountId: string | null;
  onClose: () => void; onAction: (action: ReturnType<typeof getCommentActions>[number]) => void;
}) {
  const actions = getCommentActions(comment, accountId);
  const icons = { heart: Heart, reply: Reply, edit: Pencil, delete: Trash2 };
  const labels = { heart: comment.hearted ? "conversationUnheart" : "conversationHeart", reply: "conversationReply", edit: "conversationEdit", delete: "conversationDelete" } as const;
  return <AppDialog open anchor={anchor} onOpenChange={(open) => { if (!open) onClose(); }} title={getMessage("vi", "conversationActions")} description={comment.body} hideTitle hideDescription>
    <YStack gap="$sm">
      <YStack padding="$sm" gap="$xs" borderBottomWidth={1} borderBottomColor="$border" paddingBottom="$md">
        <Text fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold" color="$textPrimary">{getCommentAuthorName(comment.author)}</Text>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary" numberOfLines={3}>{comment.body}</Text>
      </YStack>
      {actions.map((action) => {
        const Icon = icons[action];
        return <AppButton key={action} testID={`comment-action-${action}`} variant="ghost" contentAlign="start" fill depth="flat" icon={<Icon size={20} color={action === "delete" ? "$error" : "$textPrimary"} />} onPress={() => { onClose(); onAction(action); }}>{getMessage("vi", labels[action])}</AppButton>;
      })}
    </YStack>
  </AppDialog>;
}
