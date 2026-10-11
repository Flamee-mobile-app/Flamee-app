import { useAudioPlayer } from "expo-audio";
import { Image, Text, YStack } from "tamagui";
import { AppButton } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { FlameeMascot } from "./FlameeMascot";
import type { InviteGift } from "../types";

function VoiceGift({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  return <AppButton variant="secondary" onPress={() => player.play()}>{getMessage("vi", "playRecording")}</AppButton>;
}

export function InviteGiftPreview({ gift }: { gift: InviteGift | null }) {
  if (!gift) return null;
  if (gift.kind === "mascot") return <YStack alignItems="center" gap="$sm"><FlameeMascot gift={gift.gift} /><Text color="$textSecondary">{getMessage("vi", gift.gift === "heart" ? "mascotHeart" : gift.gift === "hug" ? "mascotHug" : "mascotFlower")}</Text></YStack>;
  if (gift.kind === "photo") return <YStack gap="$sm"><Image source={{ uri: gift.uri }} width="100%" height={180} resizeMode="cover" borderRadius="$lg" aria-label={getMessage("vi", "photoPreviewLabel")} />{gift.caption ? <Text>{gift.caption}</Text> : null}</YStack>;
  if (gift.kind === "voice") return <VoiceGift uri={gift.uri} />;
  return <Text fontFamily="$body" fontSize="$bodyL">{gift.text}</Text>;
}
