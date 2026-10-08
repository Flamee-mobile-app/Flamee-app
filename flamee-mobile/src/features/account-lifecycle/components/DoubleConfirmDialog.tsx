import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppField, SectionCard } from "../../../shared/components";
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
      {state.step === 1 ? (
        <AppButton variant="destructive" onPress={() => setState((current) => reduceDestructiveConfirmation(current, { type: "begin" }))}>{getMessage("vi", "understandContinue")}</AppButton>
      ) : (
        <YStack gap="$sm">
          <Text fontSize="$bodyS" color="$textSecondary">{getMessage("vi", "typeToConfirm")} “{phrase}”</Text>
          <AppField label={getMessage("vi", "confirmationLabel")} value={state.confirmation} onChangeText={(value) => setState((current) => reduceDestructiveConfirmation(current, { type: "type", value }))} autoCapitalize="characters" />
          <XStack gap="$sm">
            <AppButton flex={1} variant="ghost" onPress={() => setState((current) => reduceDestructiveConfirmation(current, { type: "cancel" }))}>{getMessage("vi", "cancel")}</AppButton>
            <AppButton flex={1} variant="destructive" disabled={busy || !isDestructiveConfirmationValid(state, phrase)} onPress={() => void confirmDestructiveAction({ ...state, phrase, action: onConfirm })}>{actionLabel}</AppButton>
          </XStack>
        </YStack>
      )}
    </SectionCard>
  );
}
