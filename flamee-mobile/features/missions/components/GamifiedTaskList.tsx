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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import type { Mission } from '@/features/missions/types';

interface GamifiedTaskListProps {
  missions: Mission[];
  onCompleteMission: (id: string) => void;
  onDismissTask: (id: string) => void;
  onNavigateToList: () => void;
}

interface AnimatedTaskCardProps {
  item: Mission;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
}

function AnimatedTaskCard({ item, onComplete, onDismiss }: AnimatedTaskCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const height = useSharedValue(58);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (item.completed) {
      // Juicy UI Transition: Shrink, fade out, collapse height and remove!
      scale.value = withSpring(0.4, { damping: 10, stiffness: 120 });
      opacity.value = withTiming(0, { duration: 220 });
      height.value = withTiming(0, { duration: 280 }, (finished) => {
        if (finished) {
          runOnJS(onDismiss)(item.id);
        }
      });
    } else {
      // Bounce feedback & complete mission
      scale.value = withSequence(
        withSpring(0.96, { damping: 8 }),
        withSpring(1.0, { damping: 6 })
      );
      onComplete(item.id);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    height: height.value,
    marginBottom: opacity.value === 0 ? 0 : 10,
  }));

  return (
    <Animated.View style={[styles.taskCardWrapper, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          styles.taskCard,
          item.completed ? styles.taskCardCompleted : styles.taskCardPending,
        ]}
      >
        {/* Flame or Check Icon Left */}
        <View style={[styles.iconCircle, item.completed ? styles.iconCircleDone : styles.iconCirclePending]}>
          {item.completed ? (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          ) : (
            <Text style={styles.flameEmoji}>🔥</Text>
          )}
        </View>

        {/* Task Title */}
        <Text
          style={[
            styles.taskTitle,
            item.completed && styles.taskTitleCompleted,
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {/* XP Badge Right */}
        <View style={styles.rightXpWrapper}>
          <Text style={[styles.xpText, item.completed && styles.xpTextCompleted]}>
            +{item.xp} XP
          </Text>
          <View style={[styles.starBadge, item.completed && styles.starBadgeCompleted]}>
            <Ionicons name="star" size={12} color={item.completed ? '#6EBD8B' : '#FF7158'} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function GamifiedTaskList({
  missions,
  onCompleteMission,
  onDismissTask,
  onNavigateToList,
}: GamifiedTaskListProps) {
  // Completed tasks sorted to TOP
  const sortedMissions = [...missions].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? -1 : 1;
  });

  return (
    <View style={styles.cardContainer}>
      {/* Curved Header Title Badge "Nhiệm vụ" */}
      <View style={styles.curvedHeaderBadge}>
        <Text style={styles.curvedHeaderText}>Nhiệm vụ</Text>
      </View>

      {/* List of Tasks */}
      <View style={styles.listContainer}>
        {sortedMissions.map((item) => (
          <AnimatedTaskCard
            key={item.id}
            item={item}
            onComplete={onCompleteMission}
            onDismiss={onDismissTask}
          />
        ))}
      </View>

      {/* Bottom Right Link */}
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          onNavigateToList();
        }}
        activeOpacity={0.8}
        style={styles.navigateLinkWrapper}
      >
        <Text style={styles.navigateLinkText}>Xem danh sách nhiệm vụ</Text>
        <Ionicons name="arrow-forward" size={16} color="#FF7158" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    alignItems: 'center',
  },
  curvedHeaderBadge: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  curvedHeaderText: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 22,
    color: '#FF7158',
  },
  listContainer: {
    width: '100%',
  },
  taskCardWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  taskCard: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
  },
  taskCardCompleted: {
    backgroundColor: '#E8F8EE',
    borderColor: '#6EBD8B',
  },
  taskCardPending: {
    backgroundColor: '#FFF1E4',
    borderColor: '#FFE6CE',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePending: {
    backgroundColor: '#FFFFFF',
  },
  iconCircleDone: {
    backgroundColor: '#6EBD8B',
  },
  flameEmoji: {
    fontSize: 16,
  },
  taskTitle: {
    fontFamily: flameeFonts.bold,
    fontSize: 14,
    color: '#2B2B2B',
    flex: 1,
  },
  taskTitleCompleted: {
    color: '#555555',
    textDecorationLine: 'line-through',
  },
  rightXpWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#888888',
  },
  xpTextCompleted: {
    color: '#2D8A4E',
  },
  starBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadgeCompleted: {
    borderColor: '#6EBD8B',
  },
  navigateLinkWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navigateLinkText: {
    fontFamily: flameeFonts.bold,
    fontSize: 14,
    color: '#FF7158',
  },
});
