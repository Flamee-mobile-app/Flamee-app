import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { X } from "@tamagui/lucide-icons-2/icons/X";
import { Image } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { getMessage } from "../../../shared/localization/messages";
import { mascotStickerCatalog } from "../mascotCatalog";

export function MascotStickerPicker({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) {
  return (
    <YStack gap="$md">
      <YStack gap="$xs">
        <Text fontFamily="$heading" fontSize="$bodyL" fontWeight="$semibold" color="$textPrimary">
          {getMessage("vi", "mascotOptionalTitle")}
        </Text>
        <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">
          {getMessage("vi", "mascotOptionalBody")}
        </Text>
      </YStack>
      <XStack flexWrap="wrap" gap="$sm" role="group" aria-label={getMessage("vi", "mascotOptionalTitle")}>
        <YStack
          width={72}
          minHeight={72}
          borderRadius="$lg"
          borderWidth={1}
          borderColor={value === null ? "$primary" : "$border"}
          backgroundColor={value === null ? "$accentSoft" : "$surface"}
          alignItems="center"
          justifyContent="center"
          role="button"
          aria-label={getMessage("vi", "mascotNone")}
          onPress={() => onChange(null)}
          pressStyle={{ opacity: 0.72 }}
        >
          <X size={20} color="$textSecondary" />
        </YStack>
        {mascotStickerCatalog.map((sticker) => {
          const selected = sticker.id === value;
          return (
            <YStack
              key={sticker.id}
              width={72}
              minHeight={72}
              borderRadius="$lg"
              borderWidth={selected ? 2 : 1}
              borderColor={selected ? "$primary" : "$border"}
              backgroundColor="$surface"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
              role="button"
              aria-label={getMessage("vi", sticker.labelKey)}
              onPress={() => onChange(sticker.id)}
              pressStyle={{ opacity: 0.72 }}
            >
              <Image source={sticker.source()} style={{ width: 62, height: 62 }} resizeMode="contain" accessible={false} />
              {selected ? (
                <YStack position="absolute" right={4} top={4} width={20} height={20} borderRadius="$sm" backgroundColor="$primary" alignItems="center" justifyContent="center">
                  <Check size={13} color="$white" />
                </YStack>
              ) : null}
            </YStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
