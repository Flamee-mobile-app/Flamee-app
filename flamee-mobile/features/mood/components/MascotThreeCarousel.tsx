import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { MascotArtwork } from '@/features/mascot/components/MascotArtwork';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import type { MoodCheckinItem } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MascotThreeCarouselProps {
  options: MoodCheckinItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onDoubleClickSelect?: (index: number) => void;
}

export function MascotThreeCarousel({
  options,
  selectedIndex,
  onSelectIndex,
  onDoubleClickSelect,
}: MascotThreeCarouselProps) {
  const total = options.length;
  const lastTapRef = useRef<{ index: number; timestamp: number }>({ index: -1, timestamp: 0 });

  const scaleValue = useSharedValue(1);

  // Helper to wrap index safely within [0, total - 1]
  const getIndex = (offset: number) => {
    return (selectedIndex + offset + total) % total;
  };

  const leftIndex = getIndex(-1);
  const centerIndex = selectedIndex;
  const rightIndex = getIndex(1);

  const leftItem = options[leftIndex];
  const centerItem = options[centerIndex];
  const rightItem = options[rightIndex];

  // Handle Swipe/Drag gesture using PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -30) {
          // Swiped Left -> Move to Next Mascot
          Haptics.selectionAsync();
          onSelectIndex((selectedIndex + 1) % total);
        } else if (gestureState.dx > 30) {
          // Swiped Right -> Move to Previous Mascot
          Haptics.selectionAsync();
          onSelectIndex((selectedIndex - 1 + total) % total);
        }
      },
    })
  ).current;

  const handleMascotPress = (targetIndex: number) => {
    const now = Date.now();
    const isDoubleTap =
      lastTapRef.current.index === targetIndex &&
      now - lastTapRef.current.timestamp < 350;

    lastTapRef.current = { index: targetIndex, timestamp: now };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (targetIndex !== selectedIndex) {
      onSelectIndex(targetIndex);
    }

    if (isDoubleTap) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scaleValue.value = withSequence(
        withSpring(1.2, { damping: 12, stiffness: 200 }),
        withTiming(1.0, { duration: 200 })
      );
      onDoubleClickSelect?.(targetIndex);
    }
  };

  const centerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* 3 Mascot Stage Row */}
      <View style={styles.stageRow}>
        {/* Left Mascot (Smaller, Dimmed) */}
        {leftItem && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleMascotPress(leftIndex)}
            style={styles.sideMascotWrapper}
          >
            <View style={styles.sideMascotCircle}>
              <MascotArtwork mood={leftItem.mood} size={54} />
            </View>
            <Text style={styles.sideMascotLabel}>{leftItem.label}</Text>
          </TouchableOpacity>
        )}

        {/* Center Mascot (Enlarged, Glowing, Prominent) */}
        {centerItem && (
          <Animated.View style={[styles.centerMascotWrapper, centerAnimatedStyle]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleMascotPress(centerIndex)}
              style={styles.centerMascotTouch}
            >
              <View style={styles.centerGlowRing}>
                <View style={styles.centerMascotCircle}>
                  <MascotArtwork mood={centerItem.mood} size={105} />
                </View>
              </View>

              {/* Status Mood Pill Badge */}
              <View style={[styles.centerMoodBadge, { backgroundColor: centerItem.color }]}>
                <Text style={styles.centerMoodText}>{centerItem.label}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Right Mascot (Smaller, Dimmed) */}
        {rightItem && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleMascotPress(rightIndex)}
            style={styles.sideMascotWrapper}
          >
            <View style={styles.sideMascotCircle}>
              <MascotArtwork mood={rightItem.mood} size={54} />
            </View>
            <Text style={styles.sideMascotLabel}>{rightItem.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Swipe Indicator Dots */}
      <View style={styles.dotsRow}>
        {options.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === selectedIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stageRow: {
    width: SCREEN_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    height: 220,
  },
  sideMascotWrapper: {
    alignItems: 'center',
    opacity: 0.55,
    gap: 6,
  },
  sideMascotCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideMascotLabel: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerMascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerMascotTouch: {
    alignItems: 'center',
  },
  centerGlowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  centerMascotCircle: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#FFF1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMoodBadge: {
    marginTop: -14,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  centerMoodText: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
