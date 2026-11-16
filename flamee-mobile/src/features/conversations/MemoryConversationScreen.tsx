import { KeyboardAvoidingView, Platform, useWindowDimensions } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useIsFocused, useRouter } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import { MessageCircle } from "@tamagui/lucide-icons-2/icons/MessageCircle";
import { ArrowLeft } from "@tamagui/lucide-icons-2/icons/ArrowLeft";
import { AppButton, AppIconButton, AppImageViewer, AppMediaButton, AppProfileAvatar, AppRemoteImage, AppScreen, AppSkeleton, AppTextButton } from "../../shared/components";
import { getMessage } from "../../shared/localization/messages";
import { memoryDetailOptions, memoryQueryKeys, memoryService, type MemoryList, type MemoryDetail } from "../moments";
import type { InfiniteData } from "@tanstack/react-query";
import { CommentsPanel } from "./CommentsPanel";
import { useConversationContext } from "./useConversationContext";
import { PostHeartAction } from "./PostHeartAction";
import { useSessionStore } from "../../shared/state/sessionStore";
import { getContainedImageFrame } from "../../shared/layout/containedImageFrame";

function PostPhoto({ photo, onOpen, onRetry }: { photo: MemoryDetail["images"][number]; onOpen: () => void; onRetry: () => void }) {
  const { height } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);
  const frame = getContainedImageFrame(photo.width, photo.height, width, height * 0.45);
  useEffect(() => setFailed(false), [photo.url]);
  return <YStack width="100%" onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}>
    {failed ? <AppButton variant="ghost" onPress={onRetry}>{getMessage("vi", "retry")}</AppButton> : <AppMediaButton onPress={onOpen} accessibilityLabel={getMessage("vi", "memoryViewPhoto")}>
      <YStack width="100%" height={width ? frame.height : height * 0.3} backgroundColor="$surfaceMuted" overflow="hidden">
        <AppRemoteImage uri={photo.url} previewUri={photo.thumbnail_url} resizeMode="contain" accessibilityLabel={getMessage("vi", "memoryViewPhoto")} onError={() => setFailed(true)} />
      </YStack>
    </AppMediaButton>}
  </YStack>;
}

export function MemoryConversationScreen({ memoryId, commentId }: { memoryId: string; commentId?: string }) {
  const router = useRouter();
  const { scope, key, ready, active } = useConversationContext();
  const focused = useIsFocused();
  const client = useQueryClient();
  const memory = useQuery({ ...memoryDetailOptions(scope, memoryId, memoryService.detail), enabled: ready && active && !!memoryId });
  const summary = client.getQueryData<InfiniteData<MemoryList, number>>(memoryQueryKeys.feed(scope))?.pages.flatMap((page) => page.items).find((item) => item.id === memoryId);
  const record = memory.data;
  const author = record?.author ?? summary?.author;
  const ownAvatar = useSessionStore((state) => state.activeAvatarUrl);
  const authorName = author?.username?.trim() || author?.full_name || getMessage("vi", "memoryFeedShared");
  const [photoId, setPhotoId] = useState<string | null>(null);
  useEffect(() => { if (!focused || !ready || memory.isError) setPhotoId(null); }, [focused, ready, memory.isError]);
  const selectedPhoto = focused && ready && !memory.isError ? record?.images.find((photo) => photo.id === photoId) : undefined;
  const retry = () => { void memory.refetch(); };
  const header = (commentCount?: number) => record ? <YStack gap="$md" paddingBottom="$sm">
    <XStack alignItems="center" gap="$sm" paddingHorizontal="$lg" paddingTop="$sm">
      <AppIconButton tone="plain" icon={<ArrowLeft size={22} color="$textPrimary" />} accessibilityLabel={getMessage("vi", "back")} onPress={() => router.back()} />
      <AppProfileAvatar uri={author?.id === scope.accountId ? ownAvatar : author?.avatar_url} size={36} fallbackSeed={author?.id ?? record.created_by} accessibilityLabel={authorName} onRefresh={retry} />
      <YStack flex={1} gap="$xs"><Text fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold" color="$textPrimary">{authorName}</Text>
        <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{record.memory_date}</Text></YStack>
    </XStack>
    <YStack paddingHorizontal="$lg" gap="$sm">
      <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{record.title}</Text>
      {record.description ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{record.description}</Text> : null}
    </YStack>
    {record.images.map((photo) => <PostPhoto key={photo.id} photo={photo} onRetry={retry} onOpen={() => setPhotoId(photo.id)} />)}
    <XStack alignItems="center" gap="$lg" paddingBottom="$xs" paddingHorizontal="$lg">
      <PostHeartAction memoryId={memoryId} />
      <XStack alignItems="center" gap="$sm" accessibilityLabel={getMessage("vi", "conversationTitle")}>
        <MessageCircle size={21} color="$textSecondary" />
        {typeof (commentCount ?? record.comment_count ?? summary?.comment_count) === "number" ? <Text fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{String(commentCount ?? record.comment_count ?? summary?.comment_count)}</Text> : null}
      </XStack>
    </XStack>
  </YStack> : null;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <AppScreen scroll={false} padded={false} backgroundTone="plain" contentProps={{ flex: 1, gap: 0 }}>
      {!ready || memory.isPending || memory.isError ? <XStack paddingHorizontal="$lg"><AppIconButton tone="plain" icon={<ArrowLeft size={22} color="$textPrimary" />} accessibilityLabel={getMessage("vi", "back")} onPress={() => router.back()} /></XStack> : null}
      {!ready ? <Text fontFamily="$body" fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "inboxConnect")}</Text> : memory.isPending ? <AppSkeleton height={100} width="100%" /> : memory.isError ? <>
        <Text role="alert" fontFamily="$body" fontSize="$bodyM" color="$accentText">{getMessage("vi", "conversationUnavailable")}</Text><AppButton variant="ghost" onPress={() => { void memory.refetch(); }}>{getMessage("vi", "retry")}</AppButton>
      </> : <CommentsPanel key={`${key}:${memoryId}`} memoryId={memoryId} targetCommentId={commentId} header={header} scrollToLatestOnMount={false} edgeToEdge />}
    </AppScreen>
    {selectedPhoto && record ? <AppImageViewer uri={selectedPhoto.url} previewUri={selectedPhoto.thumbnail_url} title={record.title} onClose={() => setPhotoId(null)} onRetry={retry}
      footer={<><Text fontFamily="$body" fontSize="$bodyM" fontWeight="$semibold" color="$white">{authorName}</Text><Text fontFamily="$body" fontSize="$bodyM" color="$white" numberOfLines={3}>{record.title}</Text><XStack gap="$lg"><PostHeartAction memoryId={memoryId} inverse /><AppTextButton tone="inverse" accessibilityLabel={getMessage("vi", "conversationTitle")} icon={<MessageCircle color="$white" size={21} />} onPress={() => setPhotoId(null)}>{typeof (record.comment_count ?? summary?.comment_count) === "number" ? String(record.comment_count ?? summary?.comment_count) : null}</AppTextButton></XStack></>} /> : null}
  </KeyboardAvoidingView>;
}
