import { zodResolver } from "@hookform/resolvers/zod";
import { Apple, Chrome, Phone } from "@tamagui/lucide-icons-2";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import {
  AppButton,
  AppField,
  AppHeader,
  AppScreen,
  SectionCard,
  StatusBanner,
} from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { localAuthService } from "../localAuthService";
import { phoneSchema, type PhoneInput } from "../schemas";

type AuthStage = "methods" | "phone";

export function AuthScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<AuthStage>("methods");
  const [providerUnavailable, setProviderUnavailable] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [busy, setBusy] = useState(false);

  const phoneForm = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  const loginProvider = (_provider: "apple" | "google") => {
    setProviderUnavailable(true);
  };

  const continueLocally = phoneForm.handleSubmit(async (value) => {
    setBusy(true);
    setAuthError(false);
    try {
      const session = await localAuthService.continueOnThisDevice(value.phone);
      useSessionStore.getState().setActiveAccount(session.accountId);
      router.replace("/(onboarding)");
    } catch {
      setAuthError(true);
    } finally {
      setBusy(false);
    }
  });

  if (stage === "methods") {
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "signInTitle")} subtitle={getMessage("vi", "signInBody")} />
        {providerUnavailable ? (
          <StatusBanner tone="info" title={getMessage("vi", "providerUnavailableTitle")} description={getMessage("vi", "providerUnavailableBody")} />
        ) : null}
        <YStack gap="$md">
          <AppButton icon={<Apple size={20} />} disabled={busy} onPress={() => void loginProvider("apple")}>
            {getMessage("vi", "signInApple")}
          </AppButton>
          <AppButton variant="secondary" icon={<Chrome size={20} />} disabled={busy} onPress={() => void loginProvider("google")}>
            {getMessage("vi", "signInGoogle")}
          </AppButton>
          <AppButton variant="ghost" icon={<Phone size={20} />} onPress={() => setStage("phone")}>
            {getMessage("vi", "signInPhone")}
          </AppButton>
        </YStack>
        <SectionCard tone="lavender" description={getMessage("vi", "localSessionLabel")}>
          <Text fontFamily="$body" fontSize="$bodyS" color="$textSecondary">
            {getMessage("vi", "localSessionDescription")}
          </Text>
        </SectionCard>
      </AppScreen>
    );
  }

  if (stage === "phone") {
    return (
      <AppScreen>
        <AppHeader title={getMessage("vi", "signInPhone")} showBack onBack={() => setStage("methods")} />
        <Controller
          control={phoneForm.control}
          name="phone"
          render={({ field, fieldState }) => (
            <AppField
              label={getMessage("vi", "phoneLabel")}
              placeholder={getMessage("vi", "phonePlaceholder")}
              keyboardType="phone-pad"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        {authError ? (
          <StatusBanner tone="warning" title={getMessage("vi", "localAuthErrorTitle")} description={getMessage("vi", "phoneInvalid")} />
        ) : null}
        <StatusBanner tone="info" title={getMessage("vi", "localSessionLabel")} description={getMessage("vi", "localSessionDescription")} />
        <AppButton disabled={busy} onPress={() => void continueLocally()}>
          {getMessage("vi", "continueOnThisDevice")}
        </AppButton>
      </AppScreen>
    );
  }
}
