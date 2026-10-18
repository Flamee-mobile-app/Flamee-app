import { X } from "@tamagui/lucide-icons-2/icons/X";
import { useEffect, type PropsWithChildren, type ReactNode, type RefObject } from "react";
import { BackHandler, Platform, type View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, Text, XStack, YStack } from "tamagui";
import { buttonTokens, featureTokens, sheetTokens, spacing } from "../constants/tokens";
import { getMessage } from "../localization/messages";
import { AppIconButton } from "./AppIconButton";
import { AppGlassBackdrop } from "./AppGlassBackdrop";

type Props = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  snapPoints?: number[];
  closeLabel?: string;
  blurTarget?: RefObject<View | null>;
  titleAlign?: "left" | "center";
  footer?: ReactNode;
  position?: number;
  onPositionChange?: (position: number) => void;
  onBodyHeightChange?: (height: number) => void;
  disableDrag?: boolean;
}>;

export function AppSheet({ open, onOpenChange, title, description, snapPoints = [sheetTokens.snapPoint], closeLabel = getMessage("vi", "close"), blurTarget, titleAlign = "left", footer, position, onPositionChange, onBodyHeightChange, disableDrag = false, children }: Props) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!open) return;
    if (Platform.OS === "web") {
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onOpenChange(false);
      };
      document.addEventListener("keydown", closeOnEscape);
      return () => document.removeEventListener("keydown", closeOnEscape);
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { onOpenChange(false); return true; });
    return () => subscription.remove();
  }, [open, onOpenChange]);
  const header = <XStack alignItems={titleAlign === "center" ? "center" : "flex-start"} gap="$md">
    {titleAlign === "center" ? <YStack width={buttonTokens.iconButtonSize} /> : null}
    <YStack flex={1} gap="$sm">
      <Text textAlign={titleAlign} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{title}</Text>
      {description ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{description}</Text> : null}
    </YStack>
    <AppIconButton icon={<X size={20} color="$textPrimary" />} accessibilityLabel={closeLabel} onPress={() => onOpenChange(false)} />
  </XStack>;
  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={snapPoints} position={position} onPositionChange={onPositionChange}
      moveOnKeyboardChange disableDrag={disableDrag} dismissOnSnapToBottom={!disableDrag} zIndex={sheetTokens.zIndex}>
      <Sheet.Overlay backgroundColor="$textPrimary" opacity={sheetTokens.overlayOpacity} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame backgroundColor={blurTarget ? "transparent" : "$surface"} overflow="hidden" borderTopLeftRadius="$xl" borderTopRightRadius="$xl" padding="$xl" paddingBottom={footer ? 0 : "$xl"} gap={footer ? "$md" : "$lg"} role="dialog" aria-modal={true} aria-label={title}>
        {blurTarget ? <AppGlassBackdrop blurTarget={blurTarget} /> : null}
        {!disableDrag ? <Sheet.Handle backgroundColor="$border" /> : null}
        {footer ? <YStack width="100%" maxWidth={featureTokens.maxWidth} alignSelf="center">{header}</YStack> : null}
        <YStack flex={1} minHeight={0} onLayout={(event) => onBodyHeightChange?.(event.nativeEvent.layout.height)}>
          <Sheet.ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" nestedScrollEnabled bounces={false}
            overScrollMode="never" contentInsetAdjustmentBehavior="never" decelerationRate="fast"
            contentContainerStyle={{ paddingBottom: footer ? spacing.sm : Math.max(insets.bottom, spacing.lg) }}>
            <YStack width="100%" maxWidth={featureTokens.maxWidth} alignSelf="center" gap="$lg">
              {!footer ? header : null}
              {children}
            </YStack>
          </Sheet.ScrollView>
        </YStack>
        {footer ? <YStack width="100%" maxWidth={featureTokens.maxWidth} alignSelf="center" paddingBottom={Math.max(insets.bottom, spacing.lg)}>{footer}</YStack> : null}
      </Sheet.Frame>
    </Sheet>
  );
}
