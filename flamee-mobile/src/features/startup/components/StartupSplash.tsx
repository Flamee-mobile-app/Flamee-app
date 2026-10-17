import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, BackHandler, StyleSheet, useWindowDimensions } from "react-native";
import { Asset } from "expo-asset";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming, type SharedValue } from "react-native-reanimated";
import { Text, XStack, YStack } from "tamagui";
import { spacing, startupTokens as tokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { resolveStartupLifecycleDelays, resolveStartupPrepared } from "../startupLifecycle";
import { phase, StartupArtwork, StartupBackground } from "./StartupArtwork";

const startupAssetModules = [
  require("../assets/flamee-symbol.png"),
  require("../assets/flamee-wordmark.png"),
  require("../../../public/login-bg.png"),
  require("../../../public/flamee-logo-slogan-tachnen.png"),
];

let startupAssetsPromise: Promise<void> | null = null;

function loadStartupAssets(): Promise<void> {
  startupAssetsPromise ??= Asset.loadAsync(startupAssetModules).then(() => undefined);
  return startupAssetsPromise;
}

type StartupSplashProps = {
  animationAlreadyComplete: boolean;
  dismiss: boolean;
  onPrepared: () => Promise<void>;
  onAnimationComplete: () => void;
  onRevealReady: () => void;
  onDismissed: () => void;
};

function LoadingDot({ index, breath, reducedMotion }: { index: number; breath: SharedValue<number>; reducedMotion: boolean }) {
  const style = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(breath.value * Math.PI * 2 - index * 0.9)),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

export function StartupSplash({ animationAlreadyComplete, dismiss, onPrepared, onAnimationComplete, onRevealReady, onDismissed }: StartupSplashProps) {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const systemReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(systemReducedMotion);
  const [laidOut, setLaidOut] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const animationFinished = useRef(animationAlreadyComplete);
  const time = useSharedValue(animationAlreadyComplete || reducedMotion ? tokens.duration : 0);
  const breath = useSharedValue(0);
  const opacity = useSharedValue(1);
  const handoff = useSharedValue(0);
  const revealGate = useSharedValue(0);
  const ready = resolveStartupPrepared({ laidOut, assetsReady });
  const availableHeight = dimensions.height - insets.top - insets.bottom;
  const size = Math.max(1, Math.min(tokens.maxCanvasSize, dimensions.width - spacing.xl * 2,
    availableHeight - tokens.textReserve * Math.min(dimensions.fontScale, 1.5)));

  const finishAnimation = useCallback(() => {
    if (animationFinished.current) return;
    animationFinished.current = true;
    onAnimationComplete();
  }, [onAnimationComplete]);
  const onImageError = useCallback(() => setAssetError(true), []);

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;
    void loadStartupAssets().then(() => {
      if (active) setAssetsReady(true);
    }).catch(() => {
      if (active) setAssetError(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    let completionTimer: ReturnType<typeof setTimeout> | undefined;
    void onPrepared().then(() => {
      if (!active) return;
      const elapsed = time.value;
      const delays = resolveStartupLifecycleDelays(elapsed, reducedMotion);
      if (reducedMotion) {
        cancelAnimation(time);
        cancelAnimation(breath);
        time.value = tokens.duration;
        finishAnimation();
        return;
      }
      if (!animationFinished.current) {
        completionTimer = setTimeout(finishAnimation, delays.animationComplete);
        time.value = withTiming(tokens.duration, { duration: delays.animationComplete, easing: Easing.linear, reduceMotion: ReduceMotion.Never });
      }
      breath.value = withDelay(animationFinished.current ? 0 : Math.max(0, tokens.taglineEnd - elapsed),
        withRepeat(
          withTiming(1, { duration: tokens.breatheDuration, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }),
          -1,
          true,
          undefined,
          ReduceMotion.Never,
        ),
        ReduceMotion.Never,
      );
    });
    return () => {
      active = false;
      if (completionTimer !== undefined) clearTimeout(completionTimer);
    };
  }, [ready, reducedMotion, onPrepared, finishAnimation, time, breath]);

  useEffect(() => {
    if (!dismiss || !ready) return;
    const delays = resolveStartupLifecycleDelays(time.value, reducedMotion);
    const revealTimer = setTimeout(onRevealReady, delays.revealReady);
    const dismissedTimer = setTimeout(onDismissed, delays.dismissed);
    if (!reducedMotion) {
      revealGate.value = withDelay(
        tokens.contentRevealDelay,
        withTiming(1, { duration: 1, reduceMotion: ReduceMotion.Never }),
        ReduceMotion.Never,
      );
    }
    handoff.value = withTiming(1, {
      duration: reducedMotion ? 0 : tokens.exitDuration,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      reduceMotion: ReduceMotion.Never,
    });
    opacity.value = withTiming(0, { duration: delays.dismissed, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.Never });
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(dismissedTimer);
    };
  }, [dismiss, ready, reducedMotion, opacity, handoff, revealGate, time, onRevealReady, onDismissed]);

  useEffect(() => () => {
    cancelAnimation(time);
    cancelAnimation(breath);
    cancelAnimation(opacity);
    cancelAnimation(handoff);
    cancelAnimation(revealGate);
  }, [time, breath, opacity, handoff, revealGate]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  const artworkHandoffStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reducedMotion ? 0 : -tokens.exitArtworkLift * handoff.value },
      { scale: reducedMotion ? 1 : 1 - (1 - tokens.exitArtworkScale) * handoff.value },
    ],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : phase(time.value, tokens.taglineStart, tokens.taglineEnd) * (1 - handoff.value),
    transform: [{ translateY: reducedMotion ? 0 : spacing.sm * (1 - phase(time.value, tokens.taglineStart, tokens.taglineEnd)) - spacing.lg * handoff.value }],
  }));

  if (assetError) throw new Error("Startup brand asset could not be loaded.");

  return (
    <Animated.View style={[styles.screen, screenStyle]} onLayout={() => setLaidOut(true)} accessibilityViewIsModal>
      <StatusBar hidden style="light" animated={false} />
      <StartupBackground />
      <YStack flex={1} alignItems="center" justifyContent="center" paddingTop={insets.top} paddingBottom={insets.bottom} paddingHorizontal="$xl">
        <Animated.View style={artworkHandoffStyle}>
          <YStack alignItems="center" accessible role="img" aria-label={getMessage("vi", "startupLogoLabel")}>
            <StartupArtwork time={time} breath={breath} size={size} reducedMotion={reducedMotion} onImageError={onImageError} />
          </YStack>
        </Animated.View>
        <Animated.View style={[styles.caption, taglineStyle]}>
          <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" color={tokens.tagline} textAlign="center" maxFontSizeMultiplier={1.5}>
            {getMessage("vi", "startupTagline")}
          </Text>
          <YStack alignItems="center" gap="$md" marginTop="$xxl" aria-hidden={true}>
            <XStack gap="$sm" opacity={dismiss ? 0 : 1}>
              {[0, 1, 2].map((index) => <LoadingDot key={index} index={index} breath={breath} reducedMotion={reducedMotion} />)}
            </XStack>
          </YStack>
        </Animated.View>
      </YStack>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, backgroundColor: tokens.background, zIndex: 100, overflow: "hidden" },
  caption: { alignItems: "center", maxWidth: "100%" },
  dot: { width: tokens.dotSize, height: tokens.dotSize, borderRadius: tokens.dotSize, backgroundColor: tokens.amber },
});
