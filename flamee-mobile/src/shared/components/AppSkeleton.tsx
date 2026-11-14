import { useEffect, type PropsWithChildren } from "react";
import { type DimensionValue, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { YStack } from "tamagui";
import { skeletonTokens } from "../constants/tokens";

type AppSkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  aspectRatio?: number;
};

/** A decorative loading surface. Put related shapes inside one AppSkeletonGroup. */
export function AppSkeleton({ width = "100%", height, borderRadius = skeletonTokens.radius, aspectRatio }: AppSkeletonProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue<number>(skeletonTokens.maxOpacity);

  useEffect(() => {
    cancelAnimation(opacity);
    if (reducedMotion) {
      opacity.value = skeletonTokens.restingOpacity;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(skeletonTokens.minOpacity, {
          duration: skeletonTokens.duration,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(skeletonTokens.maxOpacity, {
          duration: skeletonTokens.duration,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.System,
    );
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const dimensions: ViewStyle = { width, height, borderRadius, aspectRatio, backgroundColor: skeletonTokens.background };
  return (
    <Animated.View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[dimensions, animatedStyle]}
    />
  );
}

export function AppSkeletonGroup({ accessibilityLabel, fill = false, children }: PropsWithChildren<{ accessibilityLabel: string; fill?: boolean }>) {
  return (
    <YStack role="status" aria-label={accessibilityLabel} width="100%" flex={fill ? 1 : undefined}>
      {children}
    </YStack>
  );
}
