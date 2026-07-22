import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import type { Mission, MissionCategory } from '@/features/missions/types';

interface FeaturedSuggestCardProps {
  mission?: Mission;
  category: MissionCategory;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function FeaturedSuggestCard({
  mission,
  category,
  onComplete,
  onDismiss,
}: FeaturedSuggestCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const maxHeight = useSharedValue(220);

  if (!mission) return null;

  const categoryLabelMap: Record<MissionCategory, string> = {
    daily: 'Nhiệm vụ hôm nay',
    weekly: 'Nhiệm vụ tuần này',
    monthly: 'Nhiệm vụ tháng này',
  };

  const handleActionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mission.completed) {
      // Juicy UI Transition: Shrink, fade out, collapse height and remove completed task!
      scale.value = withSpring(0.4, { damping: 10, stiffness: 120 });
      opacity.value = withTiming(0, { duration: 220 });
      maxHeight.value = withTiming(0, { duration: 280 }, (finished) => {
        if (finished) {
          runOnJS(onDismiss)(mission.id);
        }
      });
    } else {
      // Bounce feedback & complete mission
      scale.value = withSequence(
        withSpring(0.96, { damping: 8 }),
        withSpring(1.0, { damping: 6 })
      );
      onComplete(mission.id);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    maxHeight: maxHeight.value,
    marginBottom: opacity.value === 0 ? 0 : 12,
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <View style={styles.cardContainer}>
        {/* Subtitle Label */}
        <Text style={styles.categorySubtext}>{categoryLabelMap[category]}</Text>

        {/* Main Content Row: Left 3D Gift Box + Right Title & XP */}
        <View style={styles.contentRow}>
          <View style={styles.giftIconBox}>
            <Text style={styles.giftEmoji}>🎁</Text>
          </View>

          <View style={styles.textColumn}>
            <Text style={styles.titleText}>{mission.title}</Text>
            <Text style={styles.xpBadgeText}>+{mission.xp} XP</Text>
          </View>
        </View>

        {/* Full-width Action Button */}
        <TouchableOpacity
          onPress={handleActionPress}
          activeOpacity={0.85}
          style={[
            styles.actionBtn,
            mission.completed ? styles.actionBtnDone : styles.actionBtnActive,
          ]}
        >
          <Text style={styles.actionBtnText}>
            {mission.completed ? 'Đã xong ✓' : 'Hoàn thành'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFF1E4',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    padding: 20,
    elevation: 3,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  categorySubtext: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#FF7158',
    marginBottom: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  giftIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE6CE',
  },
  giftEmoji: {
    fontSize: 34,
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 17,
    color: '#2B2B2B',
    lineHeight: 22,
  },
  xpBadgeText: {
    fontFamily: flameeFonts.bold,
    fontSize: 14,
    color: '#FF7158',
  },
  actionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: '#FF7158',
  },
  actionBtnDone: {
    backgroundColor: '#6EBD8B',
  },
  actionBtnText: {
    fontFamily: flameeFonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
