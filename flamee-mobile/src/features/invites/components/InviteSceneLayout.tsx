import { ArrowLeft } from "@tamagui/lucide-icons-2/icons/ArrowLeft";
import { useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ScrollView, YStack } from "tamagui";
import { AppBlurTarget, AppGlassBackdrop, AppIconButton, AppScreen, AppTextButton, type AppBlurTargetView } from "../../../shared/components";
import { colors, inviteSceneTokens, spacing } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";

export function InviteSceneLayout({ children, hero, onBack, onSkip, busy, centered = false }: PropsWithChildren<{ hero?: ReactNode; onBack: () => void; onSkip: () => void; busy: boolean; centered?: boolean }>) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [availableHeight, setAvailableHeight] = useState(height);
  const target = useRef<AppBlurTargetView | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { elevation, ...panelShadow } = inviteSceneTokens.panelShadow;
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (centered) return <AppScreen scroll={false} padded={false} contentProps={{ flex: 1, gap: 0 }}>
    <YStack paddingHorizontal="$lg" height={48} justifyContent="center" alignItems="flex-start">
      <AppIconButton tone="plain" disabled={busy} accessibilityLabel={getMessage("vi", "back")} icon={<ArrowLeft size={22} color="$textPrimary" aria-hidden={true} />} onPress={onBack} />
    </YStack>
    <ScrollView flex={1} bounces={false} overScrollMode="never" showsVerticalScrollIndicator={false} contentContainerStyle={styles.centeredContent}>
      <YStack width="100%" maxWidth={inviteSceneTokens.chooserWidth} alignSelf="center" gap="$xxl">
        {hero}
        {children}
      </YStack>
    </ScrollView>
    <YStack flexShrink={0} paddingHorizontal="$lg" paddingBottom="$sm" alignItems="flex-end">
      <AppTextButton tone="accent" emphasis="strong" disabled={busy} onPress={onSkip} accessibilityHint={getMessage("vi", "skipToHome")} testID="invite-skip">{getMessage("vi", "skipInvite")}</AppTextButton>
    </YStack>
  </AppScreen>;

  return <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <AppScreen scroll={false} padded={false} safeAreaEdges={["left", "right"]} contentProps={{ flex: 1, gap: 0, onLayout: (event) => setAvailableHeight(event.nativeEvent.layout.height) }}>
      <AppBlurTarget ref={target} style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" pointerEvents="none" accessible={false}>
          <Defs><LinearGradient id="invite-warmth" x1="0" y1="0" x2="0.25" y2="1">
            <Stop offset="0" stopColor={colors.surface} />
            <Stop offset="0.5" stopColor={colors.background} />
            <Stop offset="1" stopColor={colors.accentSoft} />
          </LinearGradient></Defs>
          <Rect width="100%" height="100%" fill="url(#invite-warmth)" />
        </Svg>
      </AppBlurTarget>
      <YStack flex={1} minHeight={0} width="100%" maxWidth={inviteSceneTokens.maxWidth} alignSelf="center" paddingTop={insets.top + spacing.sm}>
        <YStack paddingHorizontal="$lg" height={48} justifyContent="center" alignItems="flex-start">
          <AppIconButton tone="plain" disabled={busy} accessibilityLabel={getMessage("vi", "back")} icon={<ArrowLeft size={22} color="$textPrimary" aria-hidden={true} />} onPress={onBack} />
        </YStack>
        <YStack flex={1} minHeight={0} paddingHorizontal="$lg" paddingVertical="$lg" alignItems="center" justifyContent="center" overflow="hidden">
          {!keyboardVisible ? hero : null}
        </YStack>
      </YStack>
      <YStack width="100%" maxWidth={inviteSceneTokens.maxWidth} alignSelf="center" backgroundColor="$surface" borderTopLeftRadius={inviteSceneTokens.panelRadius} borderTopRightRadius={inviteSceneTokens.panelRadius} {...panelShadow} elevation={Platform.OS === "android" ? elevation : undefined}>
        <YStack borderTopLeftRadius={inviteSceneTokens.panelRadius} borderTopRightRadius={inviteSceneTokens.panelRadius} overflow="hidden">
          <AppGlassBackdrop blurTarget={target} tone="header" />
          <YStack position="absolute" left={0} right={0} top={0} height={1} backgroundColor="$white" pointerEvents="none" />
          <ScrollView maxHeight={Math.min(height * inviteSceneTokens.maxPanelHeightRatio, Math.max(0, availableHeight - insets.top - 56))} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never" contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingHorizontal: inviteSceneTokens.panelPadding, paddingTop: inviteSceneTokens.panelPadding, paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }}>
            <YStack gap="$lg">{children}</YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </AppScreen>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centeredContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
});
