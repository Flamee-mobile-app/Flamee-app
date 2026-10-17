import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppDialog, AppField, SectionCard } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { confirmDestructiveAction, isDestructiveConfirmationValid, reduceDestructiveConfirmation } from "../confirmationFlow";

type Props = {
  title: string;
  description: string;
  phrase: string;
  busy: boolean;
  actionLabel: string;
  onConfirm: () => void;
};

export function DoubleConfirmDialog({ title, description, phrase, busy, actionLabel, onConfirm }: Props) {
  const [state, setState] = useState<{ step: 1 | 2; confirmation: string }>({ step: 1, confirmation: "" });
  return (
    <SectionCard title={title} description={description}>
        <AppButton variant="destructive" disabled={busy} onPress={() => setState((current) => reduceDestructiveConfirmation(current, { type: "begin" }))}>{getMessage("vi", "understandContinue")}</AppButton>
      <AppDialog open={state.step === 2} title={title} description={description} dismissible={!busy}
        onOpenChange={(open) => { if (!open) setState((current) => reduceDestructiveConfirmation(current, { type: "cancel" })); }}>
        <YStack gap="$sm">
          <Text fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "typeToConfirm")} “{phrase}”</Text>
          <AppField editable={!busy} label={getMessage("vi", "confirmationLabel")} value={state.confirmation} onChangeText={(value) => setState((current) => reduceDestructiveConfirmation(current, { type: "type", value }))} autoCapitalize="characters" />
          <XStack gap="$sm">
            <AppButton grow variant="ghost" disabled={busy} onPress={() => setState((current) => reduceDestructiveConfirmation(current, { type: "cancel" }))}>{getMessage("vi", "cancel")}</AppButton>
            <AppButton grow variant="destructive" disabled={busy || !isDestructiveConfirmationValid(state, phrase)} onPress={() => void confirmDestructiveAction({ ...state, phrase, action: onConfirm })}>{actionLabel}</AppButton>
          </XStack>
        </YStack>
      </AppDialog>
    </SectionCard>
  );
}
