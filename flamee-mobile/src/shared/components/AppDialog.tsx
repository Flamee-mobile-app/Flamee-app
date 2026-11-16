import { useEffect, useState, type PropsWithChildren, type RefObject, type ReactNode } from "react";
import { BackHandler, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, type View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Dialog, ScrollView, Text, VisuallyHidden, YStack } from "tamagui";
import { colors, glassTokens, sheetTokens, spacing } from "../constants/tokens";
import { AppDialogContent } from "./AppDialogContent";
import { AppGradientText } from "./AppGradientText";
import { getDialogSurfacePresentation, type DialogSurfaceTone } from "./dialogSystemModel";
import { getAnchoredPopupLayout, type PopupAnchor } from "./anchoredPopupModel";
import { AppToastModalHost } from "./AppToast";

type Props = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  dismissible?: boolean;
  blurTarget?: RefObject<View | null>;
  titleAlign?: "left" | "center";
  hideDescription?: boolean;
  avoidKeyboard?: boolean;
  surfaceTone?: DialogSurfaceTone;
  titleTone?: "brand" | "plain";
  hideTitle?: boolean;
  headerAction?: ReactNode;
  anchor?: PopupAnchor;
  aboveSheet?: boolean;
}>;

export function AppDialog({ open, onOpenChange, title, description, dismissible = true, titleAlign = "left", hideDescription = false, avoidKeyboard = false, surfaceTone = "solid", titleTone = "brand", hideTitle = false, headerAction, anchor, aboveSheet = false, children }: Props) {
  const viewport = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measuredHeight, setMeasuredHeight] = useState(280);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  useEffect(() => {
    if (!open || !anchor) return;
    setKeyboardTop(Keyboard.metrics?.()?.screenY ?? null);
    const show = Keyboard.addListener("keyboardDidShow", (event) => setKeyboardTop(event.endCoordinates.screenY));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardTop(null));
    return () => { show.remove(); hide.remove(); };
  }, [open, anchor]);
  useEffect(() => {
    if (!open || !anchor || aboveSheet || Platform.OS === "web") return;
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (dismissible) onOpenChange(false);
      return true;
    });
    return () => back.remove();
  }, [open, anchor, aboveSheet, dismissible, onOpenChange]);
  const placement = anchor ? getAnchoredPopupLayout(anchor, { ...viewport, ...insets, height: keyboardTop ?? viewport.height, bottom: keyboardTop === null ? insets.bottom : 0 }, measuredHeight) : null;
  const descriptionNode = <Dialog.Description fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{description}</Dialog.Description>;
  const content = <AppDialogContent key="content" testID="app-dialog-surface" maxHeight="85%" gap={hideTitle && hideDescription ? 0 : "$lg"} {...getDialogSurfacePresentation(surfaceTone)}
    {...(placement ? { position: "absolute" as const, ...placement, padding: spacing.md, onLayout: (event: { nativeEvent: { layout: { height: number } } }) => setMeasuredHeight(Math.ceil(event.nativeEvent.layout.height)) } : {})}>
    <YStack gap="$sm" position="relative" zIndex={1}>
      <VisuallyHidden><Dialog.Title fontFamily="$heading" fontSize="$h4" lineHeight="$h4">{title}</Dialog.Title></VisuallyHidden>
      {!hideTitle ? titleTone === "plain" ? <Text textAlign={titleAlign} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary" aria-hidden>{title}</Text> : <AppGradientText align={titleAlign} aria-hidden>{title}</AppGradientText> : null}
      {hideDescription ? <VisuallyHidden>{descriptionNode}</VisuallyHidden> : descriptionNode}
    </YStack>
    {headerAction ? <YStack position="absolute" right="$sm" top="$sm" zIndex={2}>{headerAction}</YStack> : null}
    <ScrollView position="relative" zIndex={1} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xs }}>
      {children}
    </ScrollView>
  </AppDialogContent>;
  const nativeAboveSheet = Platform.OS !== "web" && aboveSheet;
  if (nativeAboveSheet) return <Modal visible={open} transparent animationType="fade" presentationStyle="overFullScreen" statusBarTranslucent
    supportedOrientations={["portrait", "landscape"]} onRequestClose={() => { if (dismissible) onOpenChange(false); }}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Dialog modal={false} open={open} onOpenChange={(next) => { if (next || dismissible) onOpenChange(next); }}>
        <YStack flex={1} alignItems="center" justifyContent="center" accessibilityViewIsModal>
          <Pressable testID="app-dialog-native-backdrop" accessible={false} onPress={() => { if (dismissible) onOpenChange(false); }}
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.textPrimary, opacity: glassTokens.overlayOpacity }]} />
          <KeyboardAvoidingView enabled={avoidKeyboard} behavior={Platform.OS === "ios" ? "padding" : "height"} pointerEvents="box-none"
            style={{ width: "100%", height: "100%", paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm, alignItems: "center", justifyContent: "center" }}>
            {content}
          </KeyboardAvoidingView>
        </YStack>
      </Dialog>
      <AppToastModalHost active={open} />
    </GestureHandlerRootView>
  </Modal>;
  const dialog = (
    <Dialog modal open={open} onOpenChange={(next) => { if (next || dismissible) onOpenChange(next); }}>
      <Dialog.Portal zIndex={anchor || aboveSheet ? sheetTokens.zIndex + 1 : undefined}>
        <Dialog.Overlay key="overlay" backgroundColor="$textPrimary" opacity={glassTokens.overlayOpacity} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} onPress={anchor || aboveSheet ? () => { if (dismissible) onOpenChange(false); } : undefined} />
        {anchor ? <YStack position="absolute" top={0} left={0} right={0} bottom={0} zIndex={2} pointerEvents="box-none">{content}</YStack> : avoidKeyboard ? <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} pointerEvents="box-none" style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", zIndex: 2 }}>{content}</KeyboardAvoidingView> : content}
      </Dialog.Portal>
    </Dialog>
  );
  return dialog;
}
