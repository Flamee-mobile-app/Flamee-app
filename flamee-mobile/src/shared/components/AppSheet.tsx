import { AppGradientText } from "./AppGradientText";
import { X } from "@tamagui/lucide-icons-2/icons/X";
import { useCallback, useEffect, useRef, useState, type PropsWithChildren, type ReactNode, type RefObject } from "react";
import { BackHandler, Keyboard, Platform, useWindowDimensions, type View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Sheet, Text, XStack, YStack } from "tamagui";
import { buttonTokens, featureTokens, sheetTokens, spacing } from "../constants/tokens";
import { getMessage } from "../localization/messages";
import { AppIconButton } from "./AppIconButton";
import { resolveSheetInteraction } from "./sheetInteractionModel";
import { getSheetBodyCapacity } from "../layout/sheetContentSizing";

type Props = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  snapPoints?: number[];
  closeLabel?: string;
  blurTarget?: RefObject<View | null>;
  titleAlign?: "left" | "center";
  titleTone?: "brand" | "plain";
  footer?: ReactNode;
  position?: number;
  onPositionChange?: (position: number) => void;
  onBodyHeightChange?: (height: number) => void;
  disableDrag?: boolean;
  dismissible?: boolean;
  fitContent?: boolean;
  onAfterClose?: () => void;
  renderBody?: (layout: { maxHeight: number; paddingBottom: number }) => ReactNode;
}>;

export function AppSheet({ open, onOpenChange, title, description, snapPoints = [sheetTokens.snapPoint], closeLabel = getMessage("vi", "close"), blurTarget, titleAlign = "left", titleTone = "brand", footer, position, onPositionChange, onBodyHeightChange, disableDrag = false, dismissible = true, fitContent = false, onAfterClose, renderBody, children }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [headerHeight, setHeaderHeight] = useState<number>(buttonTokens.iconButtonSize);
  const [footerHeight, setFooterHeight] = useState(footer ? buttonTokens.height + Math.max(insets.bottom, spacing.lg) : 0);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(() => Keyboard.metrics?.()?.screenY ?? null);
  const interaction = resolveSheetInteraction(disableDrag, dismissible);
  // Sheet.ScrollView's responder hook can hand a drag to its sheet even when
  // the parent's pan responder is disabled. A pinned sheet needs native scroll.
  const BodyScrollView = interaction.nativeScroll ? ScrollView : Sheet.ScrollView;
  const bodyCapacity = getSheetBodyCapacity({ viewportHeight: height, topInset: insets.top, headerHeight, footerHeight: footer ? footerHeight : 0, paddingVertical: spacing.xl + (footer ? 0 : spacing.xl), gap: footer ? spacing.md * 2 : spacing.lg, keyboardHeight: keyboardTop === null ? 0 : Math.max(0, height - keyboardTop) });
  const lastBodyHeight = useRef(0);
  const closeNotified = useRef(false);
  const currentlyOpen = useRef(open);
  currentlyOpen.current = open;
  const completeClose = useCallback(() => {
    if (currentlyOpen.current || closeNotified.current) return;
    closeNotified.current = true;
    onAfterClose?.();
  }, [onAfterClose]);
  useEffect(() => {
    if (open) { closeNotified.current = false; return; }
    // A sheet closed before its first layout may never start an animation.
    // Match the library's one-second hide fallback before disposing its owner.
    const fallback = setTimeout(completeClose, reducedMotion ? 0 : 1100);
    return () => clearTimeout(fallback);
  }, [open, reducedMotion, completeClose]);
  const reportBodyHeight = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const height = Math.round(event.nativeEvent.layout.height);
    if (height <= 0 || height === lastBodyHeight.current) return;
    lastBodyHeight.current = height;
    onBodyHeightChange?.(height);
  }, [onBodyHeightChange]);
  useEffect(() => {
    if (fitContent && open) onBodyHeightChange?.(bodyCapacity);
  }, [bodyCapacity, fitContent, onBodyHeightChange, open]);
  useEffect(() => {
    if (!open || !fitContent) return;
    setKeyboardTop(Keyboard.metrics?.()?.screenY ?? null);
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (event) => setKeyboardTop(event.endCoordinates.screenY));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardTop(null));
    return () => { show.remove(); hide.remove(); };
  }, [fitContent, open]);
  useEffect(() => {
    if (!open) return;
    if (Platform.OS === "web") {
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        if (dismissible) onOpenChange(false);
      };
      document.addEventListener("keydown", closeOnEscape);
      return () => document.removeEventListener("keydown", closeOnEscape);
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { if (dismissible) onOpenChange(false); return true; });
    return () => subscription.remove();
  }, [open, onOpenChange, dismissible]);
  const header = <XStack alignItems={titleAlign === "center" ? "center" : "flex-start"} gap="$md">
    {titleAlign === "center" ? <YStack width={buttonTokens.iconButtonSize} /> : null}
    <YStack flex={1} gap="$sm">
      {titleTone === "plain" ? <Text textAlign={titleAlign} fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary">{title}</Text> : <AppGradientText textAlign={titleAlign} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{title}</AppGradientText>}
      {description ? <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{description}</Text> : null}
    </YStack>
    <AppIconButton tone="plain" icon={<X size={20} color="$textPrimary" />} disabled={!dismissible} accessibilityLabel={closeLabel} onPress={() => onOpenChange(false)} />
  </XStack>;
  return (
    <Sheet modal open={open} onOpenChange={(next: boolean) => { if (next || dismissible) onOpenChange(next); }} snapPointsMode={fitContent ? "fit" : "percent"} snapPoints={fitContent ? ["fit"] : snapPoints} position={fitContent ? undefined : position} onPositionChange={fitContent ? undefined : onPositionChange}
      transitionConfig={{ type: "timing", duration: reducedMotion ? 0 : 220 }} onAnimationComplete={(event) => { if (!event.open) completeClose(); }}
      moveOnKeyboardChange disableDrag={interaction.pinned} dismissOnSnapToBottom={interaction.dismissOnSnapToBottom} dismissOnOverlayPress={dismissible} zIndex={sheetTokens.zIndex}>
      <Sheet.Overlay backgroundColor="$textPrimary" opacity={sheetTokens.overlayOpacity} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame backgroundColor="$white" overflow="hidden" borderTopLeftRadius="$xl" borderTopRightRadius="$xl" padding="$xl" paddingBottom={footer ? 0 : "$xl"} gap={footer ? "$md" : "$lg"} role="dialog" aria-modal={true} aria-label={title}>
        {interaction.showHandle ? <Sheet.Handle backgroundColor="$border" /> : null}
        <YStack flexShrink={0} width="100%" maxWidth={featureTokens.maxWidth} alignSelf="center" onLayout={fitContent ? (event) => setHeaderHeight(Math.round(event.nativeEvent.layout.height)) : undefined}>{header}</YStack>
        <YStack flex={fitContent ? undefined : 1} flexShrink={fitContent ? 1 : undefined} minHeight={0} maxHeight={fitContent ? bodyCapacity : undefined} onLayout={!fitContent && onBodyHeightChange ? reportBodyHeight : undefined}>
          {renderBody ? renderBody({ maxHeight: bodyCapacity, paddingBottom: footer ? spacing.sm : Math.max(insets.bottom, spacing.lg) }) : <BodyScrollView flex={fitContent ? undefined : 1} flexGrow={fitContent ? 0 : undefined} flexShrink={fitContent ? 1 : undefined} maxHeight={fitContent ? bodyCapacity : undefined} minHeight={0} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" nestedScrollEnabled={false} bounces={false}
            showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}
            overScrollMode="never" contentInsetAdjustmentBehavior="never" decelerationRate="normal"
            contentContainerStyle={{ paddingBottom: footer ? spacing.sm : Math.max(insets.bottom, spacing.lg) }}>
            <YStack width="100%" maxWidth={featureTokens.maxWidth} alignSelf="center" gap="$lg">
              {children}
            </YStack>
          </BodyScrollView>}
        </YStack>
        {footer ? <YStack flexShrink={0} width="100%" maxWidth={featureTokens.maxWidth} alignSelf="center" paddingBottom={Math.max(insets.bottom, spacing.lg)} onLayout={fitContent ? (event) => setFooterHeight(Math.round(event.nativeEvent.layout.height)) : undefined}>{footer}</YStack> : null}
      </Sheet.Frame>
    </Sheet>
  );
}
