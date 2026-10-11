import { memo, useEffect, type PropsWithChildren } from "react";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { loginTokens } from "../../../shared/constants/tokens";

type LoginEntranceProps = PropsWithChildren<{
  order?: number;
  visible: boolean;
  reducedMotion: boolean;
  animate?: boolean;
  duration?: number;
  delay?: number;
}>;

// Animate opacity only: form geometry stays fixed throughout the reveal.
export const LoginEntrance = memo(function LoginEntrance({
  order = 0, visible, reducedMotion, animate = true, children,
  duration = loginTokens.entranceDuration, delay,
}: LoginEntranceProps) {
  const progress = useSharedValue(visible && (reducedMotion || !animate) ? 1 : 0);
  const fadeDuration = Math.max(0, duration);
  const fadeDelay = Math.max(0, delay ?? Math.min(
    loginTokens.entranceDelay + order * loginTokens.stagger,
    loginTokens.maxEntranceDelay,
  ));

  useEffect(() => {
    cancelAnimation(progress);
    if (!visible) {
      progress.value = 0;
      return;
    }
    if (reducedMotion || !animate) {
      progress.value = 1;
      return;
    }
    const fade = withTiming(1, {
      duration: fadeDuration,
      easing: Easing.out(Easing.quad),
      reduceMotion: ReduceMotion.System,
    });
    progress.value = fadeDelay > 0 ? withDelay(fadeDelay, fade, ReduceMotion.System) : fade;
    return () => cancelAnimation(progress);
  }, [visible, reducedMotion, animate, fadeDuration, fadeDelay, progress]);

  const style = useAnimatedStyle(() => ({ opacity: progress.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
});
