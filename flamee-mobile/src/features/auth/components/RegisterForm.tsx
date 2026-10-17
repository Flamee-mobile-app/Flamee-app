import { zodResolver } from "@hookform/resolvers/zod";
import { Eye } from "@tamagui/lucide-icons-2/icons/Eye";
import { EyeOff } from "@tamagui/lucide-icons-2/icons/EyeOff";
import { LockKeyhole } from "@tamagui/lucide-icons-2/icons/LockKeyhole";
import { Mail } from "@tamagui/lucide-icons-2/icons/Mail";
import { UserRound } from "@tamagui/lucide-icons-2/icons/UserRound";
import { useRef, useState } from "react";
import { Image, Keyboard, StyleSheet } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { Input, Text, XStack, YStack } from "tamagui";
import { AppButton, AppIconButton, AppTextButton, StatusBanner } from "../../../shared/components";
import { loginTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { registerSchema, type RegisterInput } from "../schemas";
import { LoginEntrance } from "./LoginEntrance";
import { authService } from "../authRuntime";
import type { AuthSession } from "../authService";
import { getAuthErrorMessage } from "../authErrorMessage";

const googleLogo = require("../../../public/google-g.png");
const fields = [
  { name: "fullName", label: "registerNameLabel", placeholder: "registerNamePlaceholder", icon: UserRound },
  { name: "email", label: "loginEmailLabel", placeholder: "loginEmailPlaceholder", icon: Mail },
  { name: "password", label: "loginPasswordLabel", placeholder: "registerPasswordPlaceholder", icon: LockKeyhole },
  { name: "confirmPassword", label: "registerConfirmLabel", placeholder: "registerConfirmPlaceholder", icon: LockKeyhole },
] as const;

type RegisterFormProps = { visible: boolean; reducedMotion: boolean; onLogin: () => void; onAuthenticated: (session: AuthSession) => Promise<void> };

export function RegisterForm({ visible, reducedMotion, onLogin, onAuthenticated }: RegisterFormProps) {
  const [focused, setFocused] = useState<keyof RegisterInput | null>(null);
  const [shown, setShown] = useState({ password: false, confirmPassword: false });
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema), mode: "onTouched",
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });
  const motion = { visible, reducedMotion, animate: false };
  const submit = form.handleSubmit(async (values) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); setError(null); setUnavailable(false); Keyboard.dismiss();
    try {
      const session = await authService.register(values.email, values.password, values.fullName);
      form.reset();
      await onAuthenticated(session);
    } catch (failure) { setError(getAuthErrorMessage(failure)); }
    finally { pending.current = false; setBusy(false); }
  });
  const returnToLogin = () => { Keyboard.dismiss(); form.reset(); onLogin(); };

  return <YStack>
    <LoginEntrance order={0} {...motion}>
      <Text role="heading" aria-level={1} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" textAlign="center" color="$textPrimary">{getMessage("vi", "registerTitle")}</Text>
      <XStack justifyContent="center" alignItems="center" flexWrap="wrap" gap="$xs" marginBottom="$sm">
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "registerHaveAccount")}</Text>
        <AppTextButton tone="accent" disabled={busy} onPress={returnToLogin}>{getMessage("vi", "loginAction")}</AppTextButton>
      </XStack>
    </LoginEntrance>
    {fields.map((item, index) => {
      const passwordKey = item.name === "password" || item.name === "confirmPassword" ? item.name : null;
      const hidden = passwordKey !== null && !shown[passwordKey];
      const Icon = item.icon;
      return <LoginEntrance key={item.name} order={index + 1} {...motion}>
        <Controller control={form.control} name={item.name} render={({ field, fieldState }) => <YStack gap="$xs" marginBottom="$sm">
          <XStack minHeight={loginTokens.controlHeight} alignItems="center" borderRadius="$xl" paddingLeft="$md" paddingRight="$xs" borderWidth={1} borderColor={fieldState.error ? "$error" : focused === item.name ? "$primary" : "$supportPeachLight"} backgroundColor="$white">
            <Icon size={18} color="$textSecondary" aria-hidden={true} />
            <Input ref={field.ref} id={"register-" + item.name} flex={1} minWidth={0} height={loginTokens.controlHeight - 2} paddingHorizontal="$md" borderWidth={0} borderRadius="$xl" backgroundColor="transparent" fontFamily="$body" fontSize="$bodyM" color="$textPrimary" placeholderTextColor="$textSecondary"
              placeholder={getMessage("vi", item.placeholder)} aria-label={getMessage("vi", item.label)} aria-invalid={!!fieldState.error} aria-describedby={fieldState.error ? "register-error-" + item.name : undefined}
              keyboardType={item.name === "email" ? "email-address" : "default"} inputMode={item.name === "email" ? "email" : "text"} autoCapitalize={item.name === "fullName" ? "words" : "none"} autoCorrect={false}
              autoComplete={passwordKey ? "new-password" : item.name === "email" ? "email" : "name"} textContentType={passwordKey ? "newPassword" : item.name === "email" ? "emailAddress" : "name"}
              secureTextEntry={hidden} type={hidden ? "password" : "text"} maxLength={item.name === "fullName" ? 100 : item.name === "email" ? 254 : 128}
              disabled={busy} value={field.value} onChangeText={(value) => { field.onChange(value); setUnavailable(false); setError(null); }} onFocus={() => setFocused(item.name)} onBlur={() => { field.onBlur(); setFocused(null); }}
              returnKeyType={index === fields.length - 1 ? "go" : "next"} submitBehavior="submit" onSubmitEditing={() => { const next = fields[index + 1]; if (next) form.setFocus(next.name); else void submit(); }} focusStyle={{ borderWidth: 0, outlineWidth: 0 }} />
            {passwordKey && <AppIconButton
              selected={!hidden}
              accessibilityLabel={getMessage("vi", hidden ? "loginShowPassword" : "loginHidePassword")}
              icon={hidden ? <Eye size={18} color="$textSecondary" aria-hidden={true} /> : <EyeOff size={18} color="$textSecondary" aria-hidden={true} />}
              onPress={() => setShown((value) => ({ ...value, [passwordKey]: !value[passwordKey] }))}
            />}
          </XStack>
          {fieldState.error && <Text id={"register-error-" + item.name} role="alert" aria-live="polite" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$error">{fieldState.error.message}</Text>}
        </YStack>} />
      </LoginEntrance>;
    })}
    <LoginEntrance order={5} duration={loginTokens.actionFadeDuration} {...motion}>
      <YStack marginTop="$sm">
        <AppButton loading={busy} onPress={() => void submit()}>{getMessage("vi", "registerAction")}</AppButton>
      </YStack>
    </LoginEntrance>
    <LoginEntrance order={6} duration={loginTokens.socialFadeDuration} {...motion}>
      <XStack alignItems="center" gap="$md" marginVertical="$md">
        <YStack flex={1} height={1} backgroundColor="$supportPeachLight" />
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "loginOr")}</Text>
        <YStack flex={1} height={1} backgroundColor="$supportPeachLight" />
      </XStack>
      <AppButton variant="secondary" disabled={busy} icon={<Image source={googleLogo} resizeMode="contain" style={styles.googleLogo} accessible={false} />} onPress={() => setUnavailable(true)}>{getMessage("vi", "signInGoogle")}</AppButton>
    </LoginEntrance>
    {unavailable && <YStack marginTop="$md"><StatusBanner tone="info" title={getMessage("vi", "loginUnavailableTitle")} description={getMessage("vi", "loginGoogleUnavailable")} /></YStack>}
    {error && <YStack marginTop="$md"><StatusBanner tone="warning" title={getMessage("vi", "authErrorTitle")} description={error} /></YStack>}
  </YStack>;
}

const styles = StyleSheet.create({ googleLogo: { width: loginTokens.googleLogoSize, height: loginTokens.googleLogoSize } });
