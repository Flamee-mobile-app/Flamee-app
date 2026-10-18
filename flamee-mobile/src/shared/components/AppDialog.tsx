import type { PropsWithChildren, RefObject } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, type View } from "react-native";
import { BlurView } from "expo-blur";
import { Dialog, ScrollView, VisuallyHidden, YStack } from "tamagui";
import { glassTokens, spacing } from "../constants/tokens";
import { AppDialogContent } from "./AppDialogContent";

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
}>;

export function AppDialog({ open, onOpenChange, title, description, dismissible = true, blurTarget, titleAlign = "left", hideDescription = false, avoidKeyboard = false, children }: Props) {
  const descriptionNode = <Dialog.Description fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{description}</Dialog.Description>;
  const content = <AppDialogContent key="content" testID="app-dialog-surface" maxHeight="85%">
    {blurTarget && Platform.OS !== "web" ? <YStack position="absolute" top={0} right={0} bottom={0} left={0} borderRadius="$xl" overflow="hidden" pointerEvents="none">
      <BlurView blurTarget={blurTarget} intensity={glassTokens.nativeDialogBlur} tint="systemUltraThinMaterialLight" blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} />
    </YStack> : null}
    <YStack gap="$sm" position="relative" zIndex={1}>
      <Dialog.Title textAlign={titleAlign} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{title}</Dialog.Title>
      {hideDescription ? <VisuallyHidden>{descriptionNode}</VisuallyHidden> : descriptionNode}
    </YStack>
    <ScrollView position="relative" zIndex={1} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xs }}>
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
