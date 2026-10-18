import { ImagePlus } from "@tamagui/lucide-icons-2/icons/ImagePlus";
import { X } from "@tamagui/lucide-icons-2/icons/X";
import { useState } from "react";
import { Image, useWindowDimensions } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Button, Spinner, Text, YStack } from "tamagui";
import { photoPickerTokens } from "../constants/tokens";
import { useButtonInteraction } from "./useButtonInteraction";
import { AppIconButton } from "./AppIconButton";
import { AppTextButton } from "./AppTextButton";

/** Empty picker or an uncropped preview with separate, non-nested remove/change actions. */
export function AppPhotoPicker({ uri, imageWidth, imageHeight, maxPreviewHeight, label, hint, removeLabel, busy, onPress, onRemove }: {
  uri: string | null;
  imageWidth?: number;
  imageHeight?: number;
  maxPreviewHeight?: number;
  label: string;
  hint: string;
  removeLabel: string;
  busy: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  const interaction = useButtonInteraction(busy);
  const reducedMotion = useReducedMotion();
  const { height: viewportHeight } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(0);
  const ratio = imageWidth && imageHeight && imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1;
  const previewHeight = Math.min(availableWidth / ratio, viewportHeight * photoPickerTokens.previewViewportRatio, maxPreviewHeight ?? Infinity);
  if (uri) return <YStack width="100%" gap="$xs" onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}>
    <YStack alignSelf="center" width={availableWidth ? previewHeight * ratio : "100%"} height={availableWidth ? previewHeight : photoPickerTokens.height}
      borderRadius={photoPickerTokens.radius} overflow="hidden" backgroundColor="$surfaceMuted">
      <Image source={{ uri }} resizeMode="contain" accessibilityLabel={label} style={{ width: "100%", height: "100%" }} />
      <YStack position="absolute" top="$xs" right="$xs" backgroundColor="$surface" borderRadius="$md">
        <AppIconButton icon={<X size={20} color="$textPrimary" />} accessibilityLabel={removeLabel} onPress={onRemove} />
      </YStack>
    </YStack>
    <YStack alignSelf="center">
      <AppTextButton disabled={busy} icon={busy ? <Spinner size="small" color="$accentText" /> : <ImagePlus size={20} color="$textPrimary" />}
        onPress={onPress}>{label}</AppTextButton>
    </YStack>
  </YStack>;
  return <Button unstyled width="100%" height={photoPickerTokens.height} minHeight={photoPickerTokens.height} borderRadius={photoPickerTokens.radius}
    borderWidth={1} borderStyle="dashed" borderColor="$textSecondary" backgroundColor="$glassFilter" overflow="hidden"
    alignItems="center" justifyContent="center" padding={0} outlineWidth={0} role="button" aria-label={label} aria-disabled={busy}
    disabled={busy} onPress={onPress} {...interaction} transform={[{ translateY: 0 }]} animateOnly={["transform"]}
    pressStyle={{ transform: [{ translateY: reducedMotion ? 0 : photoPickerTokens.pressOffset }] }}>
    <YStack alignItems="center" justifyContent="center" gap="$xs" padding="$md" pointerEvents="none">
      {busy ? <Spinner size="small" color="$accentText" /> : <ImagePlus size={photoPickerTokens.iconSize} strokeWidth={1.6} color="$textPrimary" />}
      <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$semibold" color="$textPrimary">{label}</Text>
      <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{hint}</Text>
    </YStack>
  </Button>;
}
