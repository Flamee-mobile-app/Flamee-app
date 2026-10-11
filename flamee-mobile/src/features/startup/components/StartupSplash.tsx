import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, BackHandler, StyleSheet, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Text, XStack, YStack } from "tamagui";
import { spacing, startupTokens as tokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { phase, StartupArtwork, StartupBackground } from "./StartupArtwork";

type StartupSplashProps = {
  animationAlreadyComplete: boolean;
  dismiss: boolean;
  onPrepared: () => void;
  onAnimationComplete: () => void;
  onDismissed: () => void;
};

function LoadingDot({ index, breath, reducedMotion }: { index: number; breath: SharedValue<number>; reducedMotion: boolean }) {
  const style = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(breath.value * Math.PI * 2 - index * 0.9)),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

export function StartupSplash({ animationAlreadyComplete, dismiss, onPrepared, onAnimationComplete, onDismissed }: StartupSplashProps) {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const systemReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(systemReducedMotion);
  const [laidOut, setLaidOut] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const animationFinished = useRef(animationAlreadyComplete);
  const time = useSharedValue(animationAlreadyComplete || reducedMotion ? tokens.duration : 0);
  const breath = useSharedValue(0);
  const opacity = useSharedValue(1);
  const ready = laidOut;
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
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    onPrepared();
    if (reducedMotion) {
      cancelAnimation(time);
      cancelAnimation(breath);
      time.value = tokens.duration;
      finishAnimation();
      return;
    }
    const elapsed = time.value;
    if (!animationFinished.current) {
      time.value = withTiming(tokens.duration, { duration: Math.max(0, tokens.duration - elapsed) * tokens.playbackDuration / tokens.duration, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) scheduleOnRN(finishAnimation);
      });
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
  }, [ready, reducedMotion, onPrepared, finishAnimation, time, breath]);

  useEffect(() => {
    if (!dismiss || !ready) return;
    opacity.value = withTiming(0, { duration: reducedMotion ? 0 : tokens.exitDuration, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.Never }, (finished) => {
      if (finished) scheduleOnRN(onDismissed);
    });
  }, [dismiss, ready, reducedMotion, opacity, onDismissed]);

  useEffect(() => () => {
    cancelAnimation(time);
    cancelAnimation(breath);
    cancelAnimation(opacity);
  }, [time, breath, opacity]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: reducedMotion ? 0 : -spacing.md * (1 - opacity.value) }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : phase(time.value, tokens.taglineStart, tokens.taglineEnd),
    transform: [{ translateY: reducedMotion ? 0 : spacing.sm * (1 - phase(time.value, tokens.taglineStart, tokens.taglineEnd)) }],
  }));

  if (assetError) throw new Error("Startup brand asset could not be loaded.");

  return (
    <Animated.View style={[styles.screen, screenStyle]} onLayout={() => setLaidOut(true)} accessibilityViewIsModal>
      <StatusBar hidden={!dismiss} style="dark" animated={false} />
      <StartupBackground />
      <YStack flex={1} alignItems="center" justifyContent="center" paddingTop={insets.top} paddingBottom={insets.bottom} paddingHorizontal="$xl">
        <YStack alignItems="center" accessible role="img" aria-label={getMessage("vi", "startupLogoLabel")}>
          <StartupArtwork time={time} breath={breath} size={size} reducedMotion={reducedMotion} onImageError={onImageError} />
        </YStack>
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
