import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Text } from "tamagui";
import { AppButton, AppField, FeatureScreen, appToast } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AuthError, authService } from "../../auth";
import { inviteIntent } from "../../invites";
import { localNotificationAdapter } from "../../notifications";
import { passwordChangeSchema, type PasswordChangeInput } from "../passwordChangeSchema";

const emptyForm: PasswordChangeInput = { currentPassword: "", newPassword: "", confirmPassword: "" };
const fields = [
  { key: "currentPassword", label: "passwordCurrent", autoComplete: "current-password" },
  { key: "newPassword", label: "passwordNew", autoComplete: "new-password" },
  { key: "confirmPassword", label: "passwordConfirm", autoComplete: "new-password" },
] as const;

function PasswordChangeForm({ accountId }: { accountId: string | null }) {
  const router = useRouter();
  const queries = useQueryClient();
  const [values, setValues] = useState(emptyForm);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const visible = useRef(true);
  useFocusEffect(useCallback(() => {
    visible.current = true;
    return () => { visible.current = false; setValues(emptyForm); setShowErrors(false); };
  }, []));
  const parsed = passwordChangeSchema.safeParse(values);
  const errors = !parsed.success && showErrors ? parsed.error.flatten().fieldErrors : {};

  const submit = async () => {
    if (pending.current || !accountId || useSessionStore.getState().activeAccountId !== accountId) return;
    setShowErrors(true);
    if (!parsed.success) return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await authService.changePassword(parsed.data.currentPassword, parsed.data.newPassword);
      // Another login can complete while credential cleanup is pending.
      if (useSessionStore.getState().activeAccountId !== null) return;
      inviteIntent.clear();
      queries.clear();
      void localNotificationAdapter.clearAccount(accountId).catch(() => undefined);
      router.replace("/(auth)");
      if (result.credentialsCleared) appToast.success(getMessage("vi", "passwordChanged"));
      else appToast.warning(getMessage("vi", "passwordChangedStorageWarning"));
    } catch (error) {
      if (visible.current && useSessionStore.getState().activeAccountId === accountId) {
        appToast.error(getMessage("vi", error instanceof AuthError && error.code === "currentPassword" ? "passwordCurrentInvalid" : "passwordChangeFailed"));
      }
    } finally {
      pending.current = false;
      if (visible.current) setBusy(false);
    }
  };

  return <FeatureScreen title={getMessage("vi", "passwordChangeTitle")} showBack withBottomNavigation={false}>
    <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", "passwordChangeBody")}</Text>
    {fields.map(field => <AppField key={field.key} label={getMessage("vi", field.label)} secureTextEntry autoComplete={field.autoComplete} autoCapitalize="none" autoCorrect={false} maxLength={128}
      editable={!busy} value={values[field.key]} error={errors[field.key]?.[0]}
      onChangeText={value => setValues(current => ({ ...current, [field.key]: value }))}
      returnKeyType={field.key === "confirmPassword" ? "done" : "next"} onSubmitEditing={field.key === "confirmPassword" ? () => void submit() : undefined} />)}
    <AppButton fill loading={busy} disabled={!accountId} onPress={() => void submit()}>{getMessage("vi", "passwordChangeTitle")}</AppButton>
  </FeatureScreen>;
}

export function PasswordChangeScreen() {
  const accountId = useSessionStore(state => state.activeAccountId);
  const sessionId = useSessionStore(state => state.sessionId);
  return <PasswordChangeForm key={`${sessionId}:${accountId}`} accountId={accountId} />;
}
