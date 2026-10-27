import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlatList, useWindowDimensions } from "react-native";
import { Text, YStack } from "tamagui";
import { AppButton, AppImageViewer, AppMediaButton, AppRemoteImage, AppSkeleton, AppSkeletonGroup } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { memoryDetailOptions, memoryService, type MemoryDetail, type MemoryScope, type MemorySummary } from "../../moments";
import { formatMemoryDate } from "../memoryFeedModel";
import { getContainedImageFrame } from "../../../shared/layout/containedImageFrame";
import { getMemoryPhotoPreview, reuseMemoryCover } from "../memoryPhotoModel";
import { MemoryActions } from "./MemoryActions";

type Photo = MemoryDetail["images"][number];
const DetailPhoto = memo(function DetailPhoto({ photo, onRetry, onOpen, maxHeight }: { photo: Photo; onRetry: () => void; onOpen: (id: string) => void; maxHeight: number }) {
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);
  const frame = getContainedImageFrame(photo.width, photo.height, width, maxHeight);
  useEffect(() => setFailed(false), [photo.url]);
  return <YStack width="100%" alignItems="center" marginBottom="$lg" onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}>
    {failed ? <YStack padding="$lg" gap="$md"><Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", "memoryFeedPhotoError")}</Text><AppButton variant="ghost" onPress={() => { setFailed(false); onRetry(); }}>{getMessage("vi", "retry")}</AppButton></YStack>
      : <AppMediaButton onPress={() => onOpen(photo.id)} accessibilityLabel={getMessage("vi", "memoryViewPhoto")}><YStack alignSelf="center" width={width ? frame.width : "100%"} height={width ? frame.height : maxHeight} borderRadius="$lg" overflow="hidden" backgroundColor="$surfaceMuted"><AppRemoteImage uri={photo.url} previewUri={photo.thumbnail_url} resizeMode="contain" onError={() => setFailed(true)} accessibilityLabel={getMessage("vi", "memoryViewPhoto")} /></YStack></AppMediaButton>}
  </YStack>;
});

/** One scoped detail query on demand; photo rows use a bounded native list. */
export function MemoryDetailView({ id, scope, summary, availableHeight, paddingBottom, onDeleted, enabled = true }: { id: string; scope: MemoryScope; summary: MemorySummary; availableHeight: number; paddingBottom: number; onDeleted: () => void; enabled?: boolean }) {
  const { height } = useWindowDimensions();
  const photoHeight = Math.min(height * 0.5, availableHeight * 0.75);
  const freshUrls = useRef(false);
  const read = useCallback(async (recordId: string, signal: AbortSignal) => {
    const result = await memoryService.detail(recordId, signal);
    return freshUrls.current ? result : reuseMemoryCover(result, summary);
  }, [summary]);
  const query = useQuery({ ...memoryDetailOptions(scope, id, read), enabled });
  const preview = useMemo(() => getMemoryPhotoPreview(summary), [summary]);
  const record = query.data ?? preview;
  const [contentHeight, setContentHeight] = useState(0);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const retry = useCallback(() => { freshUrls.current = true; void query.refetch({ cancelRefetch: false }); }, [query.refetch]);
  const open = useCallback((photoId: string) => setSelectedPhotoId(photoId), []);
  const closeViewer = useCallback(() => setSelectedPhotoId(null), []);
  const renderPhoto = useCallback(({ item }: { item: Photo }) => <DetailPhoto photo={item} onRetry={retry} onOpen={open} maxHeight={photoHeight} />, [retry, open, photoHeight]);
  const selectedPhoto = record?.images.find((photo) => photo.id === selectedPhotoId);
  if (!record) return <YStack gap="$md">
    {query.isError ? <YStack gap="$md"><Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$accentText">{getMessage("vi", "memoryFeedLoadErrorBody")}</Text><AppButton variant="ghost" onPress={retry}>{getMessage("vi", "retry")}</AppButton></YStack>
      : <AppSkeletonGroup accessibilityLabel={getMessage("vi", "homeLoadingTitle")}><YStack gap="$md"><AppSkeleton width="60%" height={16} /><AppSkeleton width="100%" height={Math.min(photoHeight, 240)} borderRadius={20} /></YStack></AppSkeletonGroup>}
  </YStack>;
  return <>
    <FlatList data={record.images} keyExtractor={photoKey} renderItem={renderPhoto} initialNumToRender={2} maxToRenderPerBatch={2} windowSize={3}
      style={{ height: Math.min(availableHeight, contentHeight || availableHeight), width: "100%" }} onContentSizeChange={(_width, nextHeight) => setContentHeight(Math.round(nextHeight))}
      contentContainerStyle={{ paddingBottom }} showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<YStack gap="$lg" paddingBottom="$lg">
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{formatMemoryDate(record.memory_date, "vi")}</Text>
        <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" color="$textPrimary">{record.title}</Text>
        {record.description ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{record.description}</Text> : null}
      </YStack>}
      ListFooterComponent={<YStack gap="$lg">
        {query.isFetching ? <AppSkeletonGroup accessibilityLabel={getMessage("vi", "homeLoadingTitle")}><AppSkeleton height={16} width="60%" /></AppSkeletonGroup> : null}
        {query.isError ? <YStack gap="$sm"><Text role="alert" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$accentText">{getMessage("vi", "memoryFeedLoadErrorBody")}</Text><AppButton variant="ghost" onPress={retry}>{getMessage("vi", "retry")}</AppButton></YStack> : null}
        {record.location ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{record.location}</Text> : null}
        {query.data && enabled ? <MemoryActions record={query.data} scope={scope} onDeleted={onDeleted} /> : null}
      </YStack>} />
    {selectedPhoto && enabled ? <AppImageViewer key={`${selectedPhoto.id}-${selectedPhoto.url}`} uri={selectedPhoto.url} previewUri={selectedPhoto.thumbnail_url} title={record.title} onClose={closeViewer} onRetry={retry} /> : null}
  </>;
}
const photoKey = (photo: Photo) => photo.id;
