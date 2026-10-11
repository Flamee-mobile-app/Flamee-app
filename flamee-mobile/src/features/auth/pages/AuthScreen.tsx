import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "@tamagui/lucide-icons-2/icons/Check";
import { Eye } from "@tamagui/lucide-icons-2/icons/Eye";
import { EyeOff } from "@tamagui/lucide-icons-2/icons/EyeOff";
import { LockKeyhole } from "@tamagui/lucide-icons-2/icons/LockKeyhole";
import { Mail } from "@tamagui/lucide-icons-2/icons/Mail";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { AccessibilityInfo, Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { Controller, useForm } from "react-hook-form";
import { Button, Input, ScrollView, Text, XStack, YStack } from "tamagui";
import { AppButton, StatusBanner } from "../../../shared/components";
import { loginTokens, spacing } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { useScreenReveal } from "../../../shared/motion/ScreenReveal";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { localAuthService } from "../localAuthService";
import { isMockLoginEnabled } from "../mockLoginMode";
import { RegisterForm } from "../components/RegisterForm";
import { AuthHeroBackground } from "../components/AuthHeroBackground";
import { LoginEntrance } from "../components/LoginEntrance";
import { emailLoginSchema, type EmailLoginInput } from "../schemas";
import { localOnboardingService } from "../../onboarding";
import { localCoupleService } from "../../couple";
import { inviteIntent } from "../../invites";
import { resolveEntryRoute } from "../../../shared/navigation/entryRoute";

const heroLogo = require("../../../public/flamee-logo-slogan-tachnen.png");
const googleLogo = require("../../../public/google-g.png");
type UnavailableAction = "email" | "reset" | "google";
const unavailableCopy = {
  email: "loginEmailUnavailable",
  reset: "loginResetUnavailable",
  google: "loginGoogleUnavailable",
} as const;

// Presentation-only process lifetime; never persisted as account/domain state.
let loginEntranceUsed = false;

export function AuthScreen() {
  const router = useRouter();
  const mockLoginEnabled = isMockLoginEnabled();
  const mockLoginPending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const animateEntrance = useRef(!loginEntranceUsed);
  const [register, setRegister] = useState(false);
  const insets = useSafeAreaInsets();
  const visible = useScreenReveal();
  const systemReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(systemReducedMotion);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [unavailable, setUnavailable] = useState<UnavailableAction | null>(null);
  const form = useForm<EmailLoginInput>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (visible) loginEntranceUsed = true;
  }, [visible]);

  const submit = form.handleSubmit(() => {
    Keyboard.dismiss();
    // Email authentication is not connected to the mobile local-session service.
    // Never turn unverified credentials into a signed-in local account.
    setUnavailable("email");
  });
  const motion = { visible, reducedMotion, animate: animateEntrance.current };

  const login = async () => {
    if (!mockLoginEnabled) {
      await submit();
      return;
    }
    if (mockLoginPending.current) return;
    mockLoginPending.current = true;
    setBusy(true);
    setLoginFailed(false);
    setUnavailable(null);
    Keyboard.dismiss();
    form.reset();
    try {
      const session = await localAuthService.continueWithMockSession();
      const [account, membership] = await Promise.all([
        localOnboardingService.getAccountSnapshot(session.accountId),
        localCoupleService.getMembership(session.accountId),
      ]);
      const destination = resolveEntryRoute({ bootstrapped: true, accountId: session.accountId, setupStatus: account.setupStatus, inviteIntent: Boolean(inviteIntent.getCode()), coupleStatus: membership.status });
      useSessionStore.getState().setActiveAccount(session.accountId);
      if (destination) router.replace(destination);
    } catch {
      setLoginFailed(true);
    } finally {
      mockLoginPending.current = false;
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <YStack flex={1} backgroundColor="$background" overflow="hidden">
        <ScrollView flex={1} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <YStack flexGrow={1} width="100%" maxWidth={loginTokens.screenMaxWidth} alignSelf="center">
        <YStack flexGrow={1} flexShrink={0} minHeight={loginTokens.heroMinHeight + insets.top} overflow="hidden">
          <AuthHeroBackground />
          <YStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="$textPrimary" opacity={loginTokens.heroOverlayOpacity} aria-hidden={true} />
          <YStack flex={1} paddingHorizontal={spacing.lg + Math.max(insets.left, insets.right)} paddingTop={insets.top + loginTokens.heroLogoTopGap} paddingBottom="$xxl" justifyContent="flex-start">
            <LoginEntrance order={0} {...motion}>
              <Image source={heroLogo} resizeMode="contain" fadeDuration={0} style={styles.heroLogo} accessibilityLabel={getMessage("vi", "appName")} />
            </LoginEntrance>
          </YStack>
        </YStack>

        <YStack flexShrink={0} marginTop={-loginTokens.formOverlap} borderTopLeftRadius="$xl" borderTopRightRadius="$xl" backgroundColor="$background" paddingHorizontal={spacing.xl + Math.max(insets.left, insets.right)} paddingTop="$lg" paddingBottom={Math.max(insets.bottom, spacing.lg)}>
          <YStack width="100%" maxWidth={loginTokens.maxWidth} alignSelf="center">
            {register ? <RegisterForm {...motion} onLogin={() => { setRegister(false); setUnavailable(null); }} /> : <>
            <LoginEntrance order={2} {...motion}>
              <Text role="heading" aria-level={1} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary" textAlign="center">{getMessage("vi", "loginAction")}</Text>
              <XStack alignItems="center" justifyContent="center" flexWrap="wrap" gap="$xs" marginTop="$xs" marginBottom="$sm">
                <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", "loginNoAccount")}</Text>
                <Button unstyled paddingVertical={0} paddingHorizontal="$xs" minHeight={loginTokens.linkTouchHeight} flexDirection="row" alignItems="center" justifyContent="center" role="button" onPress={() => { Keyboard.dismiss(); form.reset(); animateEntrance.current = false; setUnavailable(null); setRegister(true); }}>
                  <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$primary">{getMessage("vi", "loginSignUp")}</Text>
                </Button>
              </XStack>
            </LoginEntrance>

            <LoginEntrance order={3} {...motion}>
              <Controller control={form.control} name="email" render={({ field, fieldState }) => (
                <YStack gap="$xs" marginBottom="$sm">
                  <XStack alignItems="center" minHeight={loginTokens.controlHeight} paddingHorizontal="$lg" borderRadius="$xl" borderWidth={1} borderColor={fieldState.error ? "$error" : focused === "email" ? "$primary" : "$supportPeachLight"} backgroundColor="$white">
                    <Mail size={20} color="$textSecondary" aria-hidden={true} />
                    <Input ref={field.ref} id="login-email" flex={1} minWidth={0} height={loginTokens.controlHeight - 2} paddingHorizontal="$md" borderWidth={0} borderRadius="$xl" backgroundColor="transparent" fontFamily="$body" fontSize="$bodyM" color="$textPrimary" placeholderTextColor="$textSecondary"
                      aria-label={getMessage("vi", "loginEmailLabel")} aria-invalid={!!fieldState.error} aria-describedby={fieldState.error ? "login-email-error" : undefined}
                      placeholder={getMessage("vi", "loginEmailPlaceholder")} keyboardType="email-address" inputMode="email" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" autoCorrect={false} maxLength={254}
                      value={field.value} onChangeText={(value) => { field.onChange(value); setUnavailable(null); }} onFocus={() => setFocused("email")} onBlur={() => { setFocused(null); field.onBlur(); }} onSubmitEditing={() => form.setFocus("password")} submitBehavior="submit" returnKeyType="next"
                      focusStyle={{ borderWidth: 0, outlineWidth: 0 }} />
                  </XStack>
                  {fieldState.error && <Text id="login-email-error" role="alert" aria-live="polite" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$error">{fieldState.error.message}</Text>}
                </YStack>
              )} />
            </LoginEntrance>

            <LoginEntrance order={4} {...motion}>
              <Controller control={form.control} name="password" render={({ field, fieldState }) => (
                <YStack gap="$xs">
                  <XStack alignItems="center" minHeight={loginTokens.controlHeight} paddingLeft="$lg" paddingRight="$xs" borderRadius="$xl" borderWidth={1} borderColor={fieldState.error ? "$error" : focused === "password" ? "$primary" : "$supportPeachLight"} backgroundColor="$white">
                    <LockKeyhole size={20} color="$textSecondary" aria-hidden={true} />
                    <Input ref={field.ref} id="login-password" flex={1} minWidth={0} height={loginTokens.controlHeight - 2} paddingHorizontal="$md" borderWidth={0} borderRadius="$xl" backgroundColor="transparent" fontFamily="$body" fontSize="$bodyM" color="$textPrimary" placeholderTextColor="$textSecondary"
                      aria-label={getMessage("vi", "loginPasswordLabel")} aria-invalid={!!fieldState.error} aria-describedby={fieldState.error ? "login-password-error" : undefined}
                      placeholder={getMessage("vi", "loginPasswordPlaceholder")} secureTextEntry={!showPassword} type={showPassword ? "text" : "password"} autoComplete="current-password" textContentType="password" autoCapitalize="none" autoCorrect={false} maxLength={128}
                      value={field.value} onChangeText={(value) => { field.onChange(value); setUnavailable(null); }} onFocus={() => setFocused("password")} onBlur={() => { setFocused(null); field.onBlur(); }} onSubmitEditing={() => void login()} returnKeyType="go"
                      focusStyle={{ borderWidth: 0, outlineWidth: 0 }} />
                    <Button unstyled width={loginTokens.linkTouchHeight} height={loginTokens.linkTouchHeight} alignItems="center" justifyContent="center" aria-label={getMessage("vi", showPassword ? "loginHidePassword" : "loginShowPassword")} aria-pressed={showPassword} onPress={() => setShowPassword((value) => !value)}>
                      {showPassword ? <EyeOff size={20} color="$textSecondary" aria-hidden={true} /> : <Eye size={20} color="$textSecondary" aria-hidden={true} />}
                    </Button>
                  </XStack>
                  {fieldState.error && <Text id="login-password-error" role="alert" aria-live="polite" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$error">{fieldState.error.message}</Text>}
                </YStack>
              )} />
            </LoginEntrance>

            <LoginEntrance order={5} {...motion}>
              <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$xs" marginTop="$xs" marginBottom="$lg">
                <Button unstyled role="checkbox" aria-checked={rememberMe} aria-label={getMessage("vi", "loginRememberMe")} minHeight={loginTokens.linkTouchHeight} flexDirection="row" alignItems="center" gap="$sm" onPress={() => setRememberMe((value) => !value)}>
                  <YStack width={loginTokens.checkboxSize} height={loginTokens.checkboxSize} borderWidth={1} borderRadius={loginTokens.checkboxRadius} alignItems="center" justifyContent="center" borderColor={rememberMe ? "$primary" : "$supportPeach"} backgroundColor={rememberMe ? "$primary" : "$white"}>
                    {rememberMe && <Check size={14} color="$white" aria-hidden={true} />}
                  </YStack>
                  <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "loginRememberMe")}</Text>
                </Button>
                <Button unstyled minHeight={loginTokens.linkTouchHeight} paddingHorizontal="$xs" justifyContent="center" onPress={() => setUnavailable("reset")}>
                  <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" fontWeight="$semibold" color="$primary">{getMessage("vi", "loginForgotPassword")}</Text>
                </Button>
              </XStack>
            </LoginEntrance>

            <LoginEntrance order={6} duration={loginTokens.actionFadeDuration} {...motion}>
              <AppButton minHeight={loginTokens.controlHeight} borderRadius="$xl" disabled={busy} aria-busy={busy} onPress={() => void login()}>{getMessage("vi", busy ? "loginWorking" : "loginAction")}</AppButton>
              {mockLoginEnabled && <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" textAlign="center" marginTop="$sm">{getMessage("vi", "loginMockNotice")}</Text>}
            </LoginEntrance>

            <LoginEntrance order={7} duration={loginTokens.socialFadeDuration} {...motion}>
              <XStack alignItems="center" gap="$md" marginVertical="$md">
                <YStack flex={1} height={1} backgroundColor="$supportPeachLight" />
                <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "loginOr")}</Text>
                <YStack flex={1} height={1} backgroundColor="$supportPeachLight" />
              </XStack>
              <AppButton variant="ghost" minHeight={loginTokens.socialHeight} backgroundColor="$white" borderColor="$supportPeachLight" borderRadius="$xl" color="$textPrimary" icon={<Image source={googleLogo} style={styles.googleLogo} resizeMode="contain" accessible={false} />} onPress={() => setUnavailable("google")}>
                {getMessage("vi", "signInGoogle")}
              </AppButton>
            </LoginEntrance>
            </>}
            {unavailable && <YStack marginTop="$lg"><StatusBanner tone="info" title={getMessage("vi", "loginUnavailableTitle")} description={getMessage("vi", unavailableCopy[unavailable])} /></YStack>}
            {loginFailed && !register && <YStack marginTop="$lg"><StatusBanner tone="warning" title={getMessage("vi", "localAuthErrorTitle")} description={getMessage("vi", "loginErrorBody")} /></YStack>}
          </YStack>
        </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  heroLogo: { width: loginTokens.heroLogoWidth, height: loginTokens.heroLogoHeight },
  googleLogo: { width: loginTokens.googleLogoSize, height: loginTokens.googleLogoSize },
});
