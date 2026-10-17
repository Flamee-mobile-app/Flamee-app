import type { PropsWithChildren } from "react";
import { Dialog, ScrollView, YStack } from "tamagui";
import { glassTokens, spacing } from "../constants/tokens";
import { AppDialogContent } from "./AppDialogContent";

type Props = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  dismissible?: boolean;
}>;

export function AppDialog({ open, onOpenChange, title, description, dismissible = true, children }: Props) {
  return (
    <Dialog modal open={open} onOpenChange={(next) => { if (next || dismissible) onOpenChange(next); }}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" backgroundColor="$textPrimary" opacity={glassTokens.overlayOpacity} enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <AppDialogContent key="content" testID="app-dialog-surface" maxHeight="85%">
          <YStack gap="$sm">
            <Dialog.Title fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary">{title}</Dialog.Title>
            <Dialog.Description fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{description}</Dialog.Description>
          </YStack>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xs }}>
            {children}
          </ScrollView>
        </AppDialogContent>
      </Dialog.Portal>
    </Dialog>
  );
}
