import { AppGradientText } from "../../../shared/components";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label, ScrollView, Text, XStack, YStack } from "tamagui";
import { AppButton, AppCheckbox, AppField, AppIconButton, AppTextButton, appToast } from "../../../shared/components";
import { loginTokens, spacing } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { lockedHeroScrollProps } from "../../../shared/layout/heroScrollBehavior";
import { useScreenReveal } from "../../../shared/motion/ScreenReveal";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { resolvePostAuthRoute } from "../../../shared/navigation/entryRoute";
import { authService } from "../authRuntime";
import type { AuthSession } from "../authService";
import { getAuthErrorMessage } from "../authErrorMessage";
import { RegisterForm } from "../components/RegisterForm";
import { AuthHeroBackground } from "../components/AuthHeroBackground";
import { LoginEntrance } from "../components/LoginEntrance";
import { emailLoginSchema, type EmailLoginInput } from "../schemas";
import { resolveLoginLayout } from "../loginLayoutModel";

const heroLogo = require("../../../public/flamee-logo-slogan-tachnen.png");
const googleLogo = require("../../../public/google-g.png");
// Presentation-only process lifetime; never persisted as account/domain state.
let loginEntranceUsed = false;

export function AuthScreen() {
  const router = useRouter();
  const loginPending = useRef(false);
  const [busy, setBusy] = useState(false);
  const animateEntrance = useRef(!loginEntranceUsed);
  const [register, setRegister] = useState(false);
  const insets = useSafeAreaInsets();
  const visible = useScreenReveal();
  const systemReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(systemReducedMotion);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const form = useForm<EmailLoginInput>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });
  const layout = resolveLoginLayout({
    topInset: insets.top,
    bottomInset: insets.bottom,
  });

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (visible) loginEntranceUsed = true;
  }, [visible]);

  const motion = { visible, reducedMotion, animate: animateEntrance.current };

  const activateSession = async (session: AuthSession) => {
    useSessionStore.getState().setActiveAccount(session.accountId, session.user.couple_id ?? null, session.user.avatar_url ?? null);
    router.replace(resolvePostAuthRoute(session.user.couple_id));
  };

  const login = form.handleSubmit(async (values) => {
    if (loginPending.current) return;
    loginPending.current = true;
    setBusy(true);
    Keyboard.dismiss();
    try {
      const session = await authService.login(values.email, values.password, rememberMe);
      form.reset();
      await activateSession(session);
    } catch (error) {
      appToast.error(getMessage("vi", "authErrorTitle"), { description: getAuthErrorMessage(error) });
    } finally {
      loginPending.current = false;
      setBusy(false);
    }
  });

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <YStack flex={1} backgroundColor="$background" overflow="hidden">
        <ScrollView {...lockedHeroScrollProps} flex={1} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <YStack flexGrow={1} flexShrink={0} width="100%" maxWidth={loginTokens.screenMaxWidth} alignSelf="center">
        <YStack minHeight={layout.heroHeight} flexGrow={1} flexShrink={0} overflow="hidden">
          <AuthHeroBackground />
          <YStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="$textPrimary" opacity={loginTokens.heroOverlayOpacity} aria-hidden={true} />
          <YStack flex={1} paddingHorizontal={spacing.lg + Math.max(insets.left, insets.right)} paddingTop={insets.top + loginTokens.heroLogoTopGap} paddingBottom="$xxl" justifyContent="flex-start">
            <LoginEntrance order={0} {...motion}>
              <Image source={heroLogo} resizeMode="contain" fadeDuration={0} style={styles.heroLogo} accessibilityLabel={getMessage("vi", "appName")} />
            </LoginEntrance>
          </YStack>
        </YStack>

        <YStack flexShrink={0} marginTop={-loginTokens.formOverlap} borderTopLeftRadius="$xl" borderTopRightRadius="$xl" backgroundColor="$white" paddingHorizontal={spacing.lg + Math.max(insets.left, insets.right)} paddingTop="$md" paddingBottom={layout.surfacePaddingBottom}>
          <YStack width="100%" maxWidth={loginTokens.maxWidth} alignSelf="center">
            {register ? <RegisterForm {...motion} onAuthenticated={activateSession} onLogin={() => setRegister(false)} /> : <YStack>
            <LoginEntrance order={2} {...motion}>
              <AppGradientText role="heading" aria-level={1} fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$bold" color="$textPrimary" textAlign="center" marginBottom={layout.titleGap}>{getMessage("vi", "loginAction")}</AppGradientText>
            </LoginEntrance>

            <LoginEntrance order={3} {...motion}>
              <Controller control={form.control} name="email" render={({ field, fieldState }) => (
                <YStack marginBottom="$sm">
                  <AppField inputRef={field.ref} id="login-email" label={getMessage("vi", "loginEmailLabel")} showLabel={false}
                    startIcon={<Mail size={20} color="$textSecondary" aria-hidden={true} />}
                    placeholder={getMessage("vi", "loginEmailPlaceholder")} keyboardType="email-address" inputMode="email" autoComplete="email" textContentType="emailAddress" maxLength={254} autoCapitalize="none" autoCorrect={false}
                    editable={!busy} value={field.value} error={fieldState.error?.message}
                    onChangeText={field.onChange} onBlur={field.onBlur}
                    onSubmitEditing={() => form.setFocus("password")} submitBehavior="submit" returnKeyType="next"  />
                </YStack>
              )} />
            </LoginEntrance>

            <LoginEntrance order={4} {...motion}>
              <Controller control={form.control} name="password" render={({ field, fieldState }) => (
                <YStack marginBottom="$sm">
                  <AppField inputRef={field.ref} id="login-password" label={getMessage("vi", "loginPasswordLabel")} showLabel={false}
                    startIcon={<LockKeyhole size={20} color="$textSecondary" aria-hidden={true} />}
                    placeholder={getMessage("vi", "loginPasswordPlaceholder")} secureTextEntry={!showPassword} type={showPassword ? "text" : "password"} autoComplete="current-password" textContentType="password" maxLength={128} autoCapitalize="none" autoCorrect={false}
                    editable={!busy} value={field.value} error={fieldState.error?.message}
                    onChangeText={field.onChange} onBlur={field.onBlur}
                    onSubmitEditing={() => void login()} submitBehavior="submit" returnKeyType="go" endAction={<AppIconButton tone="plain" disabled={busy} selected={showPassword}
                      accessibilityLabel={getMessage("vi", showPassword ? "loginHidePassword" : "loginShowPassword")}
                      icon={showPassword ? <EyeOff size={20} color="$textSecondary" aria-hidden={true} /> : <Eye size={20} color="$textSecondary" aria-hidden={true} />}
                      onPress={() => setShowPassword((value) => !value)} />} />
                </YStack>
              )} />
            </LoginEntrance>

            <LoginEntrance order={5} {...motion}>
              <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$xs" marginTop="$xs" marginBottom="$lg">
                <XStack minHeight={loginTokens.linkTouchHeight} alignItems="center" gap="$sm">
                  <AppCheckbox
                    id="login-remember-me"
                    accessibilityLabel={getMessage("vi", "loginRememberMe")}
                    checked={rememberMe}
                    disabled={busy}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="login-remember-me" fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">
                    {getMessage("vi", "loginRememberMe")}
                  </Label>
                </XStack>
              </XStack>
            </LoginEntrance>

            <LoginEntrance order={6} duration={loginTokens.actionFadeDuration} {...motion}>
              <AppButton loading={busy} onPress={() => void login()}>{getMessage("vi", "loginAction")}</AppButton>
            </LoginEntrance>

            <LoginEntrance order={7} duration={loginTokens.socialFadeDuration} {...motion}>
              <XStack alignItems="center" gap="$md" marginVertical="$md">
                <YStack flex={1} height={1} backgroundColor="$supportPeachLight" />
                <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{getMessage("vi", "loginOr")}</Text>
                <YStack flex={1} height={1} backgroundColor="$supportPeachLight" />
              </XStack>
              <YStack flexGrow={0} flexShrink={0} justifyContent="flex-start" gap={layout.footerTopGap}>
                <AppButton fill variant="secondary" disabled={busy} icon={<Image source={googleLogo} style={styles.googleLogo} resizeMode="contain" accessible={false} />} onPress={() => appToast.info(getMessage("vi", "loginUnavailableTitle"), { description: getMessage("vi", "loginGoogleUnavailable") })}>
                  {getMessage("vi", "signInGoogle")}
                </AppButton>
                <XStack flexGrow={0} flexShrink={0} alignItems="center" justifyContent="center" flexWrap="wrap" gap="$xs">
                  <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{getMessage("vi", "loginNoAccount")}</Text>
                  <AppTextButton tone="accent" disabled={busy} onPress={() => { Keyboard.dismiss(); form.reset(); animateEntrance.current = false; setRegister(true); }}>
                    {getMessage("vi", "loginSignUp")}
                  </AppTextButton>
                </XStack>
              </YStack>
            </LoginEntrance>
            </YStack>}
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
