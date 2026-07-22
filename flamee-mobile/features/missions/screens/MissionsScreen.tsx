import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
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
import { StateView } from '@/shared/components/ui';
import { useMissions } from '@/features/missions/hooks/useMissions';
import {
  INITIAL_USER_PROGRESS,
  calculateNewProgress,
  completeMissionById,
  sortMissionsWithCompletedFirst,
} from '@/features/missions/services/missionService';
import type {
  Mission,
  MissionCategory,
  MissionViewMode,
  UserProgress,
} from '@/features/missions/types';

import { MascotExpHeader } from '../components/MascotExpHeader';
import { GamifiedTaskList } from '../components/GamifiedTaskList';
import { MissionCategoryTabs } from '../components/MissionCategoryTabs';
import { StreakCalendarView } from '../components/StreakCalendarView';
import { RewardModal } from '../components/RewardModal';
import { FeaturedSuggestCard } from '../components/FeaturedSuggestCard';

interface AnimatedListItemCardProps {
  item: Mission;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
}

function AnimatedListItemCard({ item, onComplete, onDismiss }: AnimatedListItemCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const height = useSharedValue(54);

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
    <Animated.View style={[styles.listItemWrapper, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          styles.listItemCard,
          item.completed ? styles.listItemCompleted : styles.listItemPending,
        ]}
      >
        <View style={styles.listItemLeft}>
          <Text style={styles.listItemTitle}>{item.title}</Text>
        </View>

        <View style={styles.xpStarBadgeRow}>
          <Text
            style={[
              styles.listItemXpText,
              item.completed && styles.listItemXpTextDone,
            ]}
          >
            +{item.xp} XP
          </Text>
          <View
            style={[
              styles.starBadge,
              item.completed && styles.starBadgeDone,
            ]}
          >
            <Ionicons
              name={item.completed ? 'checkmark' : 'star'}
              size={13}
              color={item.completed ? '#6EBD8B' : '#FF7158'}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function MissionsScreen() {
  const missionsQuery = useMissions();
  const [viewMode, setViewMode] = useState<MissionViewMode>('hub');
  const [category, setCategory] = useState<MissionCategory>('daily');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>(INITIAL_USER_PROGRESS);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);

  useEffect(() => {
    if (missionsQuery.data) {
      setMissions(sortMissionsWithCompletedFirst(missionsQuery.data));
    }
  }, [missionsQuery.data]);

  const handleCompleteMission = (id: string) => {
    const { updatedMissions, earnedXp } = completeMissionById(missions, id);
    setMissions(updatedMissions);

    if (earnedXp > 0) {
      const { newProgress, didLevelUp } = calculateNewProgress(userProgress, earnedXp);
      setUserProgress(newProgress);
      if (didLevelUp) {
        setIsLevelUp(true);
      }
    }
  };

  const handleDismissTask = (id: string) => {
    setMissions((prev) => prev.filter((m) => m.id !== id));
  };

  const handleOpenRewardModal = () => {
    setRewardModalVisible(true);
    if (isLevelUp) {
      setIsLevelUp(false);
    }
  };

  const handleCategorySelect = (selectedCat: MissionCategory) => {
    setCategory(selectedCat);
  };

  if (missionsQuery.isLoading) {
    return <StateView title="Đang tải nhiệm vụ..." loading />;
  }

  if (missionsQuery.isError) {
    return (
      <StateView
        title="Không tải được nhiệm vụ"
        actionLabel="Thử lại"
        onAction={() => missionsQuery.refetch()}
      />
    );
  }

  // --- Frame 4: Streak & Calendar View ---
  if (viewMode === 'streak') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />
        <StreakCalendarView
          progress={userProgress}
          onBack={() => setViewMode('list')}
        />
      </SafeAreaView>
    );
  }

  // --- Frame 1: Detailed Mission List Screen ---
  if (viewMode === 'list') {
    const categoryMissions = missions.filter((m) => m.category === category);
    const sortedCategoryMissions = sortMissionsWithCompletedFirst(categoryMissions);

    // Featured suggested mission (first mission in category)
    const featuredMission = sortedCategoryMissions[0];
    // Remaining additional missions
    const additionalMissions = sortedCategoryMissions.slice(1);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header with Title "Nhiệm vụ nho nhỏ" & Route Link to Streak View */}
        <View style={styles.listHeader}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setViewMode('hub');
            }}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#FF7158" />
          </TouchableOpacity>
          <Text style={styles.listHeaderTitle}>Nhiệm vụ nho nhỏ</Text>

          {/* Route Link to Streak Calendar View */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setViewMode('streak');
            }}
            style={styles.streakLinkBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.streakLinkEmoji}>🔥</Text>
            <Text style={styles.streakLinkText}>Chuỗi</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.listScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Filter Chips (Daily, Weekly, Monthly) */}
          <MissionCategoryTabs
            selectedCategory={category}
            onSelectCategory={handleCategorySelect}
          />

          {/* Card Suggest "Nhiệm vụ hôm nay / tuần này / tháng này" */}
          {featuredMission && (
            <FeaturedSuggestCard
              mission={featuredMission}
              category={category}
              onComplete={handleCompleteMission}
              onDismiss={handleDismissTask}
            />
          )}

          {/* Section "Nhiệm vụ thêm" (Additional Tasks) */}
          <View style={styles.additionalSectionHeader}>
            <Text style={styles.additionalSectionTitle}>Nhiệm vụ thêm</Text>
          </View>

          {/* Additional Tasks List with Juicy UI Dismissal for Completed Tasks */}
          <View style={styles.missionsListWrapper}>
            {additionalMissions.map((item) => (
              <AnimatedListItemCard
                key={item.id}
                item={item}
                onComplete={handleCompleteMission}
                onDismiss={handleDismissTask}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Frame 3: Default Main Mission Hub Screen ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFE6CE" />

      <ScrollView
        contentContainerStyle={styles.hubScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Half: Sunset Gradient Header + Logo + Streak + Emotion 08 Mascot Sticker + EXP Bar */}
        <MascotExpHeader
          progress={userProgress}
          isLevelUp={isLevelUp}
          onClaimReward={handleOpenRewardModal}
        />

        {/* Bottom Half: Curved White Card + Gamified Task List + Juicy UI dismissal */}
        <GamifiedTaskList
          missions={missions}
          onCompleteMission={handleCompleteMission}
          onDismissTask={handleDismissTask}
          onNavigateToList={() => setViewMode('list')}
        />
      </ScrollView>

      {/* Reward Pop-up Modal */}
      <RewardModal
        visible={rewardModalVisible}
        onClose={() => setRewardModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },
  hubScrollContent: {
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE6CE',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeaderTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 22,
    color: '#FF7158',
  },
  streakLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FFE6CE',
  },
  streakLinkEmoji: {
    fontSize: 14,
  },
  streakLinkText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#FF7158',
  },
  listScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  additionalSectionHeader: {
    marginTop: 16,
    marginBottom: 10,
  },
  additionalSectionTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 20,
    color: '#FF7158',
  },
  missionsListWrapper: {
    width: '100%',
  },
  listItemWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  listItemCard: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  listItemCompleted: {
    backgroundColor: '#E8F8EE',
    borderColor: '#6EBD8B',
  },
  listItemPending: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE6CE',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  listItemTitle: {
    fontFamily: flameeFonts.bold,
    fontSize: 14,
    color: '#2B2B2B',
  },
  xpStarBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listItemXpText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#888888',
  },
  listItemXpTextDone: {
    color: '#2D8A4E',
  },
  starBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadgeDone: {
    backgroundColor: '#E8F8EE',
    borderColor: '#6EBD8B',
  },
});
