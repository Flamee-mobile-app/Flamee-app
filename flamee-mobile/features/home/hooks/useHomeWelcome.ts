import { AccessibilityInfo, Animated } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getHomeWelcomeContent } from '../lib/homeWelcomeContent';
import { consumeHomeWelcomeSession } from '../lib/homeWelcomeSession';

export function useHomeWelcome() {
  const [shouldAnimate, setShouldAnimate] = useState(consumeHomeWelcomeSession);
  const [reduceMotion, setReduceMotion] = useState(false);
  const greeting = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  const quote = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  const content = useMemo(() => getHomeWelcomeContent(new Date()), []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => setReduceMotion(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!shouldAnimate || reduceMotion) {
      greeting.setValue(1);
      quote.setValue(1);
      return;
    }

    greeting.setValue(0);
    quote.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(greeting, { duration: 260, toValue: 1, useNativeDriver: true }),
      Animated.timing(quote, { duration: 220, toValue: 1, useNativeDriver: true }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [greeting, quote, reduceMotion, shouldAnimate]);

  useEffect(() => {
    if (reduceMotion) setShouldAnimate(false);
  }, [reduceMotion]);

  return {
    content,
    greetingStyle: {
      opacity: greeting,
      transform: [{ translateY: greeting.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    },
    quoteStyle: {
      opacity: quote,
      transform: [{ translateY: quote.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
    },
    shouldAnimate: shouldAnimate && !reduceMotion,
  };
}
