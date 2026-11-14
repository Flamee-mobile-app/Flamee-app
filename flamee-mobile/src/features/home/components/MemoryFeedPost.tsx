import { Ellipsis } from "@tamagui/lucide-icons-2/icons/Ellipsis";
import { MessageCircle } from "@tamagui/lucide-icons-2/icons/MessageCircle";
import { MapPin } from "@tamagui/lucide-icons-2/icons/MapPin";
import { Pin } from "@tamagui/lucide-icons-2/icons/Pin";
import { RotateCcw } from "@tamagui/lucide-icons-2/icons/RotateCcw";
import { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppIconButton, AppMediaButton, AppProfileAvatar, AppRemoteImage, AppTextButton, SectionCard, appToast } from "../../../shared/components";
import { memoryFeedTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import type { MemorySummary } from "../../moments";
import { formatMemoryDate } from "../memoryFeedModel";

function MemoryPhoto({ memory, square = false, onPress, onRetry }: { memory: MemorySummary; square?: boolean; onPress?: () => void; onRetry?: () => void }) {
  const [failed, setFailed] = useState(false);
  const uri = square ? memory.thumbnail_url : memory.cover_image?.url ?? memory.thumbnail_url;
  useEffect(() => setFailed(false), [uri]);
  if (!uri) return null;
  if (failed) return <YStack width="100%" aspectRatio={square ? 1 : memoryFeedTokens.photoAspectRatio} borderRadius={memoryFeedTokens.photoRadius} backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center"><YStack alignItems="center" gap="$sm" padding="$lg">
      <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary" textAlign="center">{getMessage("vi", "memoryFeedPhotoError")}</Text>
      <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "retry")} icon={<RotateCcw size={18} color="$textSecondary" />} onPress={() => { setFailed(false); onRetry?.(); }} />
    </YStack></YStack>;
  const photo = <YStack width="100%" aspectRatio={square ? 1 : memoryFeedTokens.photoAspectRatio} borderRadius={memoryFeedTokens.photoRadius} backgroundColor="$surfaceMuted" overflow="hidden" justifyContent="center" alignItems="center">
    <AppRemoteImage
      uri={uri}
      previewUri={memory.thumbnail_url}
      accessibilityLabel={memory.title}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
    {memory.image_count > 1 ? <YStack position="absolute" right="$sm" bottom="$sm" paddingHorizontal="$sm" paddingVertical="$xs" borderRadius="$sm" backgroundColor="$glassCard">
      <Text fontFamily="$body" fontSize="$bodyS" color="$textPrimary">{formatMessage("vi", "memoryFeedPhotoCount", { count: memory.image_count })}</Text>
    </YStack> : null}
  </YStack>;
  return onPress ? <AppMediaButton onPress={onPress} accessibilityLabel={`${getMessage("vi", "memoryFeedDetails")}: ${memory.title}`}>{photo}</AppMediaButton> : photo;
}

function MemoryAuthorAvatar({ memory }: { memory: MemorySummary }) {
  const author = memory.author;
  return <AppProfileAvatar uri={author?.avatar_url} fallbackSeed={author?.id ?? memory.created_by} size={memoryFeedTokens.avatarSize}
    accessibilityLabel={author?.full_name || getMessage("vi", "memoryFeedShared")} />;
}

export function MemoryFeedPost({ memory, onDetails, onPhotoRetry }: { memory: MemorySummary; onDetails: () => void; onPhotoRetry?: () => void }) {
  const date = formatMemoryDate(memory.memory_date, "vi");
  return <YStack paddingBottom={memoryFeedTokens.postGap}><SectionCard tone="white"><YStack gap="$md">
    <XStack alignItems="center" gap="$sm">
      <MemoryAuthorAvatar memory={memory} />
      <YStack flex={1} minWidth={0} gap={2}>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary" numberOfLines={1}>{memory.author?.username || memory.author?.full_name || getMessage("vi", "memoryFeedShared")}</Text>
        {date ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{date}</Text> : null}
      </YStack>
      {memory.is_pinned ? <Pin size={14} color="$accentText" accessibilityLabel={getMessage("vi", "memoryFeedPinned")} /> : null}
      <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "memoryFeedDetails")} icon={<Ellipsis size={20} color="$textSecondary" />} onPress={onDetails} />
    </XStack>
    <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" color="$textPrimary">{memory.title}</Text>
    {memory.description ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{memory.description}</Text> : null}
    <MemoryPhoto memory={memory} onPress={onDetails} onRetry={onPhotoRetry} />
    {memory.location ? <XStack alignItems="center" gap="$xs"><MapPin size={14} color="$textSecondary" aria-hidden={true} /><Text flex={1} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{memory.location}</Text></XStack> : null}
    <YStack height={1} backgroundColor="$border" opacity={0.55} />
    <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$xs">
      <AppTextButton icon={<MessageCircle size={19} color="$textSecondary" />} onPress={() => appToast.info(getMessage("vi", "memoryCommentsUnavailable"))}>{getMessage("vi", "memoryComments")}</AppTextButton>
      {memory.image_count > 0 ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{formatMessage("vi", "memoryFeedPhotoCount", { count: memory.image_count })}</Text> : null}
    </XStack>
  </YStack></SectionCard></YStack>;
}

export function MemoryGalleryTile({ memory }: { memory: MemorySummary }) {
  return <YStack gap="$sm" paddingBottom="$xl">
    <MemoryPhoto memory={memory} square />
    <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$medium" color="$textPrimary" numberOfLines={2}>{memory.title}</Text>
    <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{formatMemoryDate(memory.memory_date, "vi")}</Text>
  </YStack>;
}
