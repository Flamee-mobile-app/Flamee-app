import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, BackHandler, Image, StyleSheet, useWindowDimensions, View } from "react-native";
import { Asset } from "expo-asset";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Text, YStack } from "tamagui";
import { startupTokens as tokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { resolveStartupPrepared, resolveStartupProgress } from "../startupLifecycle";
import { StartupBackground } from "./StartupBackground";

const symbol = require("../assets/flamee-symbol.png");
const wordmark = require("../assets/flamee-wordmark.png");
let assetsPromise: Promise<void> | undefined;

type BrandSplashProps = {
  sessionReady: boolean;
  destinationReady: boolean;
  animationAlreadyComplete: boolean;
  dismiss: boolean;
  onPrepared: () => Promise<void>;
  onAnimationComplete: () => void;
  onRevealReady: () => void;
  onDismissed: () => void;
};

function LoadingDot({ index, pulse, reducedMotion }: { index: number; pulse: SharedValue<number>; reducedMotion: boolean }) {
  const style = useAnimatedStyle(() => ({
    opacity: reducedMotion ? (index === 1 ? 1 : 0.55) : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(pulse.value * Math.PI * 2 - index * 1.6)),
  }));
  return <Animated.View style={[styles.dot, index === 1 && styles.activeDot, style]} />;
}

export function BrandSplash({ sessionReady, destinationReady, animationAlreadyComplete, dismiss, onPrepared, onAnimationComplete, onRevealReady, onDismissed }: BrandSplashProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height - insets.top - insets.bottom < 580;
  const wordmarkWidth = Math.min(tokens.brandMaxWordmarkWidth, width * tokens.brandWordmarkWidthRatio);
  const symbolWidth = Math.min(wordmarkWidth * tokens.brandSymbolWidthRatio / tokens.brandWordmarkWidthRatio, compact ? 90 : 140);
  const loaderWidth = Math.min(tokens.loaderMaxWidth, width * tokens.loaderWidthRatio);
  const systemReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(systemReducedMotion);
  const [laidOut, setLaidOut] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const completed = useRef(animationAlreadyComplete);
  const brandOpacity = useSharedValue(animationAlreadyComplete || reducedMotion ? 1 : 0);
  const screenOpacity = useSharedValue(1);
  const progress = useSharedValue(0);
  const pulse = useSharedValue(0);
  const ready = resolveStartupPrepared({ laidOut, assetsReady });
  const onImageError = useCallback(() => setAssetError(true), []);

  // Milestones describe completed startup work, never a simulated network percentage.
  const progressTarget = resolveStartupProgress({ prepared: ready, sessionReady, destinationReady, canDismiss: dismiss });
  useEffect(() => {
    progress.value = withTiming(progressTarget, {
      duration: reducedMotion ? 0 : tokens.loaderProgressDuration,
      easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.Never,
    });
  }, [progressTarget, reducedMotion, progress]);

  useEffect(() => {
    if (!ready || reducedMotion || dismiss) {
      cancelAnimation(pulse);
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: tokens.breatheDuration, easing: Easing.linear, reduceMotion: ReduceMotion.Never }), -1, false);
    return () => cancelAnimation(pulse);
  }, [ready, reducedMotion, dismiss, pulse]);

  useEffect(() => {
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    const back = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => { listener.remove(); back.remove(); };
  }, []);

  useEffect(() => {
    let active = true;
    assetsPromise ??= Asset.loadAsync([symbol, wordmark]).then(() => undefined).catch((error: unknown) => {
      assetsPromise = undefined;
      throw error;
    });
    void assetsPromise.then(() => {
      if (active) setAssetsReady(true);
    }, () => { if (active) setAssetError(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void onPrepared().then(() => {
      if (!active) return;
      brandOpacity.value = withTiming(1, {
        duration: reducedMotion ? 0 : tokens.brandFadeDuration,
        easing: Easing.out(Easing.quad),
        reduceMotion: ReduceMotion.Never,
      });
      if (completed.current) return;
      // Keep the static brand readable even when system motion is reduced.
      timer = setTimeout(() => {
        completed.current = true;
        onAnimationComplete();
      }, tokens.playbackDuration);
    });
    return () => { active = false; if (timer !== undefined) clearTimeout(timer); };
  }, [ready, reducedMotion, onPrepared, onAnimationComplete, brandOpacity]);

  useEffect(() => {
    if (!dismiss || !ready) return;
    // Let the bar visibly finish before handing over to the mounted destination.
    const finishDelay = reducedMotion ? 0 : tokens.loaderProgressDuration;
    const fadeTimer = setTimeout(() => {
      screenOpacity.value = withTiming(0, {
        duration: reducedMotion ? 0 : tokens.exitDuration,
        easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.Never,
      });
    }, finishDelay);
    const revealTimer = setTimeout(onRevealReady, finishDelay + (reducedMotion ? 0 : tokens.contentRevealDelay));
    const dismissedTimer = setTimeout(onDismissed, finishDelay + (reducedMotion ? 0 : tokens.exitDuration));
    return () => { clearTimeout(fadeTimer); clearTimeout(revealTimer); clearTimeout(dismissedTimer); };
  }, [dismiss, ready, reducedMotion, onRevealReady, onDismissed, screenOpacity]);

  useEffect(() => () => {
    cancelAnimation(brandOpacity);
    cancelAnimation(screenOpacity);
    cancelAnimation(progress);
    cancelAnimation(pulse);
  }, [brandOpacity, screenOpacity, progress, pulse]);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const brandStyle = useAnimatedStyle(() => ({ opacity: brandOpacity.value }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (assetError) throw new Error("Startup brand asset could not be loaded.");

  return (
    <Animated.View style={[styles.screen, screenStyle]} onLayout={() => setLaidOut(true)} accessibilityViewIsModal>
      <StatusBar hidden style="dark" animated={false} />
      <StartupBackground />
      <YStack flex={1} alignItems="center" justifyContent="center" paddingTop={insets.top} paddingBottom={insets.bottom} paddingHorizontal="$xl">
        <Animated.View style={[styles.brand, brandStyle]}>
          <YStack alignItems="center" gap={tokens.brandSymbolWordmarkGap} accessible role="img" aria-label={getMessage("vi", "startupLogoLabel")}>
            <Image source={symbol} resizeMode="contain" fadeDuration={0} style={{ width: symbolWidth, height: symbolWidth * 266 / 223 }} onError={onImageError} accessible={false} />
            <Image source={wordmark} resizeMode="contain" fadeDuration={0} style={{ width: wordmarkWidth, height: wordmarkWidth * 168 / 772 }} onError={onImageError} accessible={false} />
          </YStack>
          <Text marginTop={tokens.brandSloganGap} fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" color={tokens.tagline} textAlign="center" maxFontSizeMultiplier={1.5}>
            {getMessage("vi", "startupTagline")}
          </Text>
          <YStack alignItems="center" marginTop={compact ? tokens.brandSloganGap : tokens.brandLoaderGap} gap={tokens.brandProgressGap}>
            <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {[0, 1, 2].map((index) => <LoadingDot key={index} index={index} pulse={pulse} reducedMotion={reducedMotion} />)}
            </View>
            <View style={[styles.track, { width: loaderWidth }]} accessible role="progressbar" accessibilityLabel={getMessage("vi", "loadingTitle")} accessibilityValue={{ text: getMessage("vi", dismiss ? "startupReady" : "loadingDescription") }}>
              <Animated.View style={[styles.fill, progressStyle]}>
                <Svg width={loaderWidth} height={tokens.loaderHeight}>
                  <Defs><LinearGradient id="startup-progress" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={tokens.loaderStart} />
                    <Stop offset="1" stopColor={tokens.loaderEnd} />
                  </LinearGradient></Defs>
                  <Rect width={loaderWidth} height={tokens.loaderHeight} fill="url(#startup-progress)" />
                </Svg>
              </Animated.View>
            </View>
          </YStack>
        </Animated.View>
      </YStack>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, backgroundColor: tokens.background, zIndex: 100, overflow: "hidden" },
  brand: { alignItems: "center", maxWidth: "100%" },
  dots: { flexDirection: "row", gap: tokens.loaderDotGap, alignItems: "center", height: tokens.loaderDotSize + 4 },
  dot: { width: tokens.loaderDotSize, height: tokens.loaderDotSize, borderRadius: tokens.loaderDotSize, backgroundColor: tokens.loaderDot },
  activeDot: { backgroundColor: tokens.loaderActiveDot, width: tokens.loaderDotSize + 2, height: tokens.loaderDotSize + 2 },
  track: { height: tokens.loaderHeight, backgroundColor: tokens.loaderTrack, borderRadius: tokens.loaderHeight, overflow: "hidden" },
  fill: { height: tokens.loaderHeight, borderRadius: tokens.loaderHeight, overflow: "hidden" },
});
