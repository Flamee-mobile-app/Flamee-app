import { useEffect, type PropsWithChildren } from "react";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { buttonTokens } from "../constants/tokens";

/** Keep layout stable while only opacity and transforms animate on the UI thread. */
export function AppAnimatedAction({ visible, children }: PropsWithChildren<{ visible: boolean }>) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    progress.value = reducedMotion ? Number(visible) : withTiming(Number(visible), {
      duration: buttonTokens.revealDuration,
      easing: Easing.out(Easing.cubic),
    });
    return () => cancelAnimation(progress);
  }, [visible, reducedMotion, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 2 * (1 - progress.value) }, { scale: 0.94 + 0.06 * progress.value }],
  }));
  return <Animated.View pointerEvents={visible ? "auto" : "none"} accessibilityElementsHidden={!visible} importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
    style={[{ width: buttonTokens.iconButtonSize, height: buttonTokens.iconButtonSize, flexShrink: 0, alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
    {children}
  </Animated.View>;
}
