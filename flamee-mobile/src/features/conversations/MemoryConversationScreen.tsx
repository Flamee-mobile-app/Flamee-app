import { KeyboardAvoidingView, Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Text } from "tamagui";
import { AppButton, AppSkeleton, FeatureScreen } from "../../shared/components";
import { getMessage } from "../../shared/localization/messages";
import { memoryService } from "../moments";
import { CommentsPanel } from "./CommentsPanel";
import { useConversationContext } from "./useConversationContext";
import { conversationKeys } from "./conversationService";

export function MemoryConversationScreen({ memoryId, commentId }: { memoryId: string; commentId?: string }) {
  const { scope, key, ready, active } = useConversationContext();
  const memory = useQuery({ queryKey: [...conversationKeys.comments(scope, memoryId), "memory"], queryFn: ({ signal }) => memoryService.detail(memoryId, signal), enabled: ready && active && !!memoryId, retry: false });
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <FeatureScreen title={getMessage("vi", "conversationTitle")} scroll={false} showBack withBottomNavigation={false}>
      {!ready ? <Text fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "inboxConnect")}</Text> : memory.isPending ? <AppSkeleton height={100} width="100%" /> : memory.isError ? <>
        <Text role="alert" fontFamily="$body" fontSize="$bodyM" color="$accentText">{getMessage("vi", "conversationUnavailable")}</Text><AppButton variant="ghost" onPress={() => { void memory.refetch(); }}>{getMessage("vi", "retry")}</AppButton>
      </> : <><Text fontFamily="$body" fontSize="$bodyM" color="$textSecondary" numberOfLines={2}>{memory.data?.title}</Text><CommentsPanel key={`${key}:${memoryId}`} memoryId={memoryId} targetCommentId={commentId} /></>}
    </FeatureScreen>
  </KeyboardAvoidingView>;
}
