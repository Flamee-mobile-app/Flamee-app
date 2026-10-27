import type { PropsWithChildren, RefObject, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, type View } from "react-native";
import { BlurView } from "expo-blur";
import { Dialog, ScrollView, Text, VisuallyHidden, YStack } from "tamagui";
import { glassTokens, spacing } from "../constants/tokens";
import { AppDialogContent } from "./AppDialogContent";
import { AppGradientText } from "./AppGradientText";
import { getDialogSurfacePresentation, type DialogSurfaceTone } from "./dialogSystemModel";

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
}>;

export function AppDialog({ open, onOpenChange, title, description, dismissible = true, blurTarget, titleAlign = "left", hideDescription = false, avoidKeyboard = false, surfaceTone = "glass", titleTone = "brand", hideTitle = false, headerAction, children }: Props) {
  const descriptionNode = <Dialog.Description fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{description}</Dialog.Description>;
  const content = <AppDialogContent key="content" testID="app-dialog-surface" maxHeight="85%" gap={hideTitle && hideDescription ? 0 : "$lg"} {...getDialogSurfacePresentation(surfaceTone)}>
    {surfaceTone === "glass" && blurTarget && Platform.OS !== "web" ? <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius="$xl" overflow="hidden" pointerEvents="none">
      <BlurView blurTarget={blurTarget} intensity={glassTokens.nativeDialogBlur} tint="systemUltraThinMaterialLight" blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} />
    </YStack> : null}
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
  return (
    <Dialog modal open={open} onOpenChange={(next) => { if (next || dismissible) onOpenChange(next); }}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" backgroundColor="$textPrimary" opacity={glassTokens.overlayOpacity} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        {avoidKeyboard ? <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} pointerEvents="box-none" style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>{content}</KeyboardAvoidingView> : content}
      </Dialog.Portal>
    </Dialog>
  );
}
