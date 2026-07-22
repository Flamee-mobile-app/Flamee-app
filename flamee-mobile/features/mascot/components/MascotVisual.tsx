import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { MascotMood } from '../types';

import { MascotArtwork } from './MascotArtwork';

export const MOOD_AURA_COLORS: Record<MascotMood, string> = {
  neutral: 'rgba(255, 113, 88, 0.28)',
  happy: 'rgba(255, 165, 0, 0.35)',
  calm: 'rgba(76, 217, 100, 0.30)',
  sad: 'rgba(0, 122, 255, 0.28)',
  tired: 'rgba(142, 142, 147, 0.25)',
  angry: 'rgba(255, 59, 48, 0.45)',
  surprised: 'rgba(255, 204, 0, 0.45)',
};

type MascotVisualProps = {
  mood: MascotMood;
  hasUnreadNudge: boolean;
  isExpanded: boolean;
  isPressed?: boolean;
  reduceMotion: boolean;
};

export function MascotVisual({
  mood,
  hasUnreadNudge,
  isExpanded,
  isPressed = false,
  reduceMotion,
}: MascotVisualProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const rotation = useSharedValue(0);

  const auraScale = useSharedValue(1);
  const auraOpacity = useSharedValue(0.4);
  const badgeScale = useSharedValue(1);

  const isStatic = reduceMotion || Platform.OS === 'web';

  useEffect(() => {
    cancelAnimation(translateY);
    cancelAnimation(translateX);
    cancelAnimation(scaleX);
    cancelAnimation(scaleY);
    cancelAnimation(rotation);
    cancelAnimation(auraScale);
    cancelAnimation(auraOpacity);

    if (isStatic) {
      translateY.value = 0;
      translateX.value = 0;
      scaleX.value = 1;
      scaleY.value = 1;
      rotation.value = 0;
      auraScale.value = 1;
      auraOpacity.value = 0.4;
      return;
    }

    if (isPressed) {
      scaleX.value = withSpring(1.18, { damping: 12, stiffness: 220 });
      scaleY.value = withSpring(0.82, { damping: 12, stiffness: 220 });
      translateY.value = withSpring(4, { damping: 14, stiffness: 200 });
      auraScale.value = withSpring(1.3, { damping: 12, stiffness: 220 });
      auraOpacity.value = withSpring(0.7);
      return;
    }

    if (isExpanded) {
      scaleX.value = withSpring(0.94, { damping: 13, stiffness: 180 });
      scaleY.value = withSpring(0.94, { damping: 13, stiffness: 180 });
      translateY.value = withSpring(4, { damping: 14, stiffness: 160 });
      auraScale.value = withSpring(1.15, { damping: 13, stiffness: 180 });
      return;
    }

    // Mood-specific Organic Physics loops
    switch (mood) {
      case 'happy': {
        // Joyful squish-stretch spring bounce
        translateY.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 320 }),
            withTiming(0, { duration: 320 }),
          ),
          -1,
          true,
        );
        scaleX.value = withRepeat(
          withSequence(
            withTiming(0.90, { duration: 320 }),
            withTiming(1.12, { duration: 320 }),
          ),
          -1,
          true,
        );
        scaleY.value = withRepeat(
          withSequence(
            withTiming(1.12, { duration: 320 }),
            withTiming(0.88, { duration: 320 }),
          ),
          -1,
          true,
        );
        auraScale.value = withRepeat(
          withSequence(
            withTiming(1.25, { duration: 320 }),
            withTiming(1.0, { duration: 320 }),
          ),
          -1,
          true,
        );
        auraOpacity.value = 0.55;
        break;
      }

      case 'angry': {
        // High-frequency 60 FPS Jitter Shake matrix
        translateX.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 60 }),
            withTiming(3, { duration: 60 }),
            withTiming(-2, { duration: 60 }),
            withTiming(2, { duration: 60 }),
            withTiming(0, { duration: 60 }),
          ),
          -1,
          false,
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(2, { duration: 60 }),
            withTiming(-2, { duration: 60 }),
            withTiming(1, { duration: 60 }),
            withTiming(-1, { duration: 60 }),
            withTiming(0, { duration: 60 }),
          ),
          -1,
          false,
        );
        rotation.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 80 }),
            withTiming(5, { duration: 80 }),
            withTiming(0, { duration: 80 }),
          ),
          -1,
          false,
        );
        auraScale.value = withRepeat(
          withSequence(
            withTiming(1.35, { duration: 150 }),
            withTiming(1.1, { duration: 150 }),
          ),
          -1,
          true,
        );
        auraOpacity.value = withRepeat(
          withSequence(
            withTiming(0.7, { duration: 150 }),
            withTiming(0.3, { duration: 150 }),
          ),
          -1,
          true,
        );
        break;
      }

      case 'surprised': {
        // Sudden Pop & Recoil
        translateY.value = withRepeat(
          withSequence(
            withTiming(-9, { duration: 180 }),
            withTiming(0, { duration: 250 }),
            withTiming(-2, { duration: 150 }),
            withTiming(0, { duration: 800 }),
          ),
          -1,
          false,
        );
        scaleX.value = withRepeat(
          withSequence(
            withTiming(0.82, { duration: 180 }),
            withTiming(1.12, { duration: 250 }),
            withTiming(1.0, { duration: 950 }),
          ),
          -1,
          false,
        );
        scaleY.value = withRepeat(
          withSequence(
            withTiming(1.25, { duration: 180 }),
            withTiming(0.90, { duration: 250 }),
            withTiming(1.0, { duration: 950 }),
          ),
          -1,
          false,
        );
        auraScale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 180 }),
            withTiming(1.0, { duration: 1200 }),
          ),
          -1,
          false,
        );
        auraOpacity.value = 0.6;
        break;
      }

      case 'calm': {
        // Gentle Swaying
        rotation.value = withRepeat(
          withSequence(
            withTiming(-6, { duration: 1800 }),
            withTiming(6, { duration: 1800 }),
          ),
          -1,
          true,
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1800 }),
            withTiming(0, { duration: 1800 }),
          ),
          -1,
          true,
        );
        auraScale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 1800 }),
            withTiming(1.0, { duration: 1800 }),
          ),
          -1,
          true,
        );
        auraOpacity.value = 0.45;
        break;
      }

      case 'sad': {
        // Slow Droop & Pulse
        translateY.value = withRepeat(
          withSequence(
            withTiming(4, { duration: 2000 }),
            withTiming(1, { duration: 2000 }),
          ),
          -1,
          true,
        );
        scaleX.value = withRepeat(
          withSequence(
            withTiming(1.04, { duration: 2000 }),
            withTiming(1.0, { duration: 2000 }),
          ),
          -1,
          true,
        );
        scaleY.value = withRepeat(
          withSequence(
            withTiming(0.95, { duration: 2000 }),
            withTiming(1.0, { duration: 2000 }),
          ),
          -1,
          true,
        );
        auraOpacity.value = 0.3;
        break;
      }

      case 'tired': {
        // Drowsy Nodding
        rotation.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: 1600 }),
            withTiming(2, { duration: 1600 }),
          ),
          -1,
          true,
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(3, { duration: 1600 }),
            withTiming(0, { duration: 1600 }),
          ),
          -1,
          true,
        );
        auraOpacity.value = 0.25;
        break;
      }

      case 'neutral':
      default: {
        // Organic Breathing Float
        translateY.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 1400 }),
            withTiming(0, { duration: 1400 }),
          ),
          -1,
          true,
        );
        scaleX.value = withRepeat(
          withSequence(
            withTiming(0.985, { duration: 1400 }),
            withTiming(1.015, { duration: 1400 }),
          ),
          -1,
          true,
        );
        scaleY.value = withRepeat(
          withSequence(
            withTiming(1.025, { duration: 1400 }),
            withTiming(0.985, { duration: 1400 }),
          ),
          -1,
          true,
        );
        auraScale.value = withRepeat(
          withSequence(
            withTiming(1.12, { duration: 1400 }),
            withTiming(1.0, { duration: 1400 }),
          ),
          -1,
          true,
        );
        auraOpacity.value = 0.4;
        break;
      }
    }
  }, [
    auraOpacity,
    auraScale,
    isExpanded,
    isPressed,
    isStatic,
    mood,
    rotation,
    scaleX,
    scaleY,
    translateX,
    translateY,
  ]);

  useEffect(() => {
    cancelAnimation(badgeScale);
    if (!hasUnreadNudge || isStatic) {
      badgeScale.value = 1;
      return;
    }

    badgeScale.value = withRepeat(
      withSequence(withTiming(1.18, { duration: 180 }), withTiming(1, { duration: 180 })),
      3,
      false,
    );
  }, [badgeScale, hasUnreadNudge, isStatic]);

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    opacity: auraOpacity.value,
    transform: [{ scale: auraScale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const auraColor = MOOD_AURA_COLORS[mood] || MOOD_AURA_COLORS.neutral;

  return (
    <Animated.View style={[styles.mascot, mascotAnimatedStyle]} testID="mascot-visual">
      {/* Mood Aura Glow Atmosphere */}
      <Animated.View
        style={[styles.auraGlow, { backgroundColor: auraColor }, auraAnimatedStyle]}
        testID="mascot-aura-glow"
      />
      <MascotArtwork mood={mood} size={64} />
      {hasUnreadNudge && (
        <Animated.View accessibilityLabel="Có gợi ý mới" style={[styles.badge, badgeStyle]}>
          <View style={styles.badgeDot} />
          <View style={styles.badgeDot} />
          <View style={styles.badgeDot} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  auraGlow: {
    borderRadius: 32,
    height: 60,
    position: 'absolute',
    width: 60,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE6CE',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    minHeight: 20,
    minWidth: 28,
    position: 'absolute',
    right: -2,
    top: 0,
    zIndex: 10,
  },
  badgeDot: {
    backgroundColor: '#FF7158',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  mascot: {
    alignItems: 'center',
    height: 64,
    justifyContent: 'center',
    position: 'relative',
    width: 64,
  },
});

