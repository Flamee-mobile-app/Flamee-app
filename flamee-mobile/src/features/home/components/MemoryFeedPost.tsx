import { Ellipsis } from "@tamagui/lucide-icons-2/icons/Ellipsis";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { MapPin } from "@tamagui/lucide-icons-2/icons/MapPin";
import { Pin } from "@tamagui/lucide-icons-2/icons/Pin";
import { RotateCcw } from "@tamagui/lucide-icons-2/icons/RotateCcw";
import { useEffect, useState } from "react";
import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppIconButton } from "../../../shared/components";
import { memoryFeedTokens } from "../../../shared/constants/tokens";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import type { MemorySummary } from "../../moments";
import { formatMemoryDate } from "../memoryFeedModel";

function MemoryPhoto({ memory, square = false }: { memory: MemorySummary; square?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [memory.thumbnail_url]);
  if (!memory.thumbnail_url) return null;
  return <YStack width="100%" aspectRatio={square ? 1 : memoryFeedTokens.photoAspectRatio} borderRadius={memoryFeedTokens.photoRadius} backgroundColor="$surfaceMuted" overflow="hidden" justifyContent="center" alignItems="center">
    {failed ? <YStack alignItems="center" gap="$sm" padding="$lg">
      <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary" textAlign="center">{getMessage("vi", "memoryFeedPhotoError")}</Text>
      <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "retry")} icon={<RotateCcw size={18} color="$textSecondary" />} onPress={() => setFailed(false)} />
    </YStack> : <Image
      source={{ uri: memory.thumbnail_url }}
      accessibilityLabel={memory.title}
      resizeMode="cover"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%" }}
    />}
    {memory.image_count > 1 ? <YStack position="absolute" right="$sm" bottom="$sm" paddingHorizontal="$sm" paddingVertical="$xs" borderRadius="$sm" backgroundColor="$glassCard">
      <Text fontFamily="$body" fontSize="$bodyS" color="$textPrimary">{formatMessage("vi", "memoryFeedPhotoCount", { count: memory.image_count })}</Text>
    </YStack> : null}
  </YStack>;
}

/** Existing album summaries have no author identity or comment counts. Never invent either. */
export function MemoryFeedPost({ memory, onDetails }: { memory: MemorySummary; onDetails: () => void }) {
  const date = formatMemoryDate(memory.memory_date, "vi");
  return <YStack gap="$md" paddingBottom={memoryFeedTokens.postGap}>
    <XStack alignItems="center" gap="$sm">
      <YStack width={memoryFeedTokens.avatarSize} height={memoryFeedTokens.avatarSize} borderRadius="$xl" backgroundColor="$accentSoft" alignItems="center" justifyContent="center" aria-hidden={true}>
        <Heart size={16} color="$accentText" strokeWidth={1.8} />
      </YStack>
      <YStack flex={1} minWidth={0} gap={2}>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "memoryFeedShared")}</Text>
        {date ? <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{date}</Text> : null}
      </YStack>
      {memory.is_pinned ? <Pin size={14} color="$accentText" accessibilityLabel={getMessage("vi", "memoryFeedPinned")} /> : null}
      <AppIconButton tone="plain" accessibilityLabel={getMessage("vi", "memoryFeedDetails")} icon={<Ellipsis size={20} color="$textSecondary" />} onPress={onDetails} />
    </XStack>
    <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" color="$textPrimary">{memory.title}</Text>
    <MemoryPhoto memory={memory} />
    {memory.location ? <XStack alignItems="center" gap="$xs"><MapPin size={14} color="$textSecondary" aria-hidden={true} /><Text flex={1} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{memory.location}</Text></XStack> : null}
  </YStack>;
}

export function MemoryGalleryTile({ memory }: { memory: MemorySummary }) {
  return <YStack gap="$sm" paddingBottom="$xl">
    <MemoryPhoto memory={memory} square />
    <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$medium" color="$textPrimary" numberOfLines={2}>{memory.title}</Text>
    <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{formatMemoryDate(memory.memory_date, "vi")}</Text>
  </YStack>;
}
