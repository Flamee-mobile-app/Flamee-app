import { AccessibilityInfo } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export const MASCOT_MESSAGE_MOTION_DURATION = 200;

export function useMascotMessageMotion(isExpanded: boolean) {
  const progress = useSharedValue(isExpanded ? 1 : 0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [shouldRenderExpandedBubble, setShouldRenderExpandedBubble] = useState(isExpanded);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {
        if (isMounted) setReduceMotion(false);
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const finishClosing = useCallback(() => {
    setShouldRenderExpandedBubble(false);
  }, []);

  useEffect(() => {
    if (isExpanded) {
      setShouldRenderExpandedBubble(true);
      progress.value = reduceMotion
        ? 1
        : withTiming(1, {
            duration: MASCOT_MESSAGE_MOTION_DURATION,
            easing: Easing.out(Easing.quad),
          });
      return;
    }

    if (reduceMotion) {
      progress.value = 0;
      finishClosing();
      return;
    }

    progress.value = withTiming(
      0,
      {
        duration: MASCOT_MESSAGE_MOTION_DURATION,
        easing: Easing.out(Easing.quad),
      },
      (finished) => {
        if (finished) runOnJS(finishClosing)();
      },
    );
  }, [finishClosing, isExpanded, progress, reduceMotion]);

  const expandedBubbleStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.95 + progress.value * 0.05 },
      { translateY: (1 - progress.value) * 6 },
    ],
  }));

  const collapsedBadgeStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { scale: 1 - progress.value * 0.05 },
      { translateY: progress.value * -4 },
    ],
  }));

  return {
    collapsedBadgeStyle,
    expandedBubbleStyle,
    shouldRenderExpandedBubble,
  };
}
