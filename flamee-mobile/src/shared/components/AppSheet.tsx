import { X } from "@tamagui/lucide-icons-2/icons/X";
import type { PropsWithChildren } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, Text, XStack, YStack } from "tamagui";
import { featureTokens, sheetTokens, spacing } from "../constants/tokens";
import { getMessage } from "../localization/messages";
import { AppIconButton } from "./AppIconButton";

type Props = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  snapPoints?: number[];
  closeLabel?: string;
}>;

export function AppSheet({ open, onOpenChange, title, description, snapPoints = [sheetTokens.snapPoint], closeLabel = getMessage("vi", "close"), children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={snapPoints} dismissOnSnapToBottom zIndex={sheetTokens.zIndex}>
      <Sheet.Overlay backgroundColor="$textPrimary" opacity={sheetTokens.overlayOpacity} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame backgroundColor="$surface" borderTopLeftRadius="$xl" borderTopRightRadius="$xl" padding="$xl" gap="$lg" role="dialog" aria-modal={true} aria-label={title}>
        <Sheet.Handle backgroundColor="$border" />
        <Sheet.ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
          <YStack width="100%" maxWidth={featureTokens.maxWidth} alignSelf="center" gap="$lg">
            <XStack alignItems="flex-start" gap="$md">
              <YStack flex={1} gap="$sm">
                <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{title}</Text>
                {description ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{description}</Text> : null}
              </YStack>
              <AppIconButton icon={<X size={20} color="$textPrimary" />} accessibilityLabel={closeLabel} onPress={() => onOpenChange(false)} />
            </XStack>
            {children}
          </YStack>
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
}
