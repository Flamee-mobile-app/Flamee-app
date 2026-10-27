import { AppGradientText } from "../../../shared/components";
import { X } from "@tamagui/lucide-icons-2/icons/X";
import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { AppChoiceTile } from "../../../shared/components";
import { choiceTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { mascotStickerCatalog } from "../mascotCatalog";

export function MascotStickerPicker({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) {
  return <YStack gap="$md">
    <YStack gap="$xs">
      <AppGradientText fontFamily="$heading" fontSize="$bodyL" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "mascotOptionalTitle")}</AppGradientText>
      <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "mascotOptionalBody")}</Text>
    </YStack>
    <XStack flexWrap="wrap" gap="$sm" role="radiogroup" aria-label={getMessage("vi", "mascotOptionalTitle")}>
      <AppChoiceTile label={getMessage("vi", "mascotNone")} selected={value === null} artwork={<X size={20} color="$textSecondary" />} onPress={() => onChange(null)} />
      {mascotStickerCatalog.map((sticker) => <AppChoiceTile key={sticker.id} label={getMessage("vi", sticker.labelKey)} selected={value === sticker.id}
        artwork={<Image source={sticker.source()} style={{ width: choiceTokens.artworkSize, height: choiceTokens.artworkSize }} resizeMode="contain" accessible={false} />}
        onPress={() => onChange(sticker.id)} />)}
    </XStack>
  </YStack>;
}
