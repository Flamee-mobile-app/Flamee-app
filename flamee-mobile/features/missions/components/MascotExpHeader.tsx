import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import { FlameeIcon } from '@/shared/components/icons';
import type { UserProgress } from '@/features/missions/types';

interface MascotExpHeaderProps {
  progress: UserProgress;
  isLevelUp?: boolean;
  onClaimReward?: () => void;
}

export function MascotExpHeader({ progress, isLevelUp = false, onClaimReward }: MascotExpHeaderProps) {
  const insets = useSafeAreaInsets();
  const giftScale = useSharedValue(1);
  const giftRotate = useSharedValue(0);

  const paddingTop = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 20) + 8;

  // Trigger animation when level up occurs
  useEffect(() => {
    if (isLevelUp) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      giftScale.value = withRepeat(
        withSequence(
          withSpring(1.35, { damping: 4, stiffness: 120 }),
          withSpring(1.0, { damping: 6, stiffness: 100 })
        ),
        -1,
        true
      );

      giftRotate.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 150 }),
          withTiming(12, { duration: 150 }),
          withTiming(0, { duration: 150 })
        ),
        -1,
        true
      );
    } else {
      giftScale.value = withTiming(1, { duration: 250 });
      giftRotate.value = withTiming(0, { duration: 250 });
    }
  }, [isLevelUp]);

  const giftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: giftScale.value },
      { rotate: `${giftRotate.value}deg` },
    ],
  }));

  const handleGiftPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onClaimReward) {
      onClaimReward();
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (progress.currentXp / progress.maxXp) * 100));

  return (
    <LinearGradient
      colors={['#FFE6CE', '#FFF1E4', '#FAF9F7']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.gradientContainer, { paddingTop }]}
    >
      {/* Top Bar Row: Logo Left & Streak Right */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <FlameeIcon name="logo" size={32} color="#FF7158" />
          <Text style={styles.logoText}>Flamee</Text>
        </View>

        {/* Top Right Streak - Only shown when streakDays > 0 */}
        {progress.streakDays > 0 && (
          <View style={styles.streakCol}>
            <Text style={styles.streakLabel}>Chuỗi</Text>
            <Text style={styles.streakBigNum}>{progress.streakDays}</Text>
          </View>
        )}
      </View>

      {/* Mascot Center Stage (Emotion 08 Mascot Sticker) */}
      <View style={styles.mascotStage}>
        <Image
          source={require('@/assets/images/mascot/emotion_08_om_mieng_coi.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>

      {/* Level & Gift Row */}
      <View style={styles.levelRow}>
        <TouchableOpacity
          onPress={handleGiftPress}
          activeOpacity={0.8}
          style={styles.giftTouchable}
        >
          <Animated.View style={[styles.giftBoxWrapper, giftAnimatedStyle]}>
            <Ionicons
              name={isLevelUp ? 'gift' : 'gift-outline'}
              size={26}
              color={isLevelUp ? '#FF7158' : '#FCB76D'}
            />
            {isLevelUp && <View style={styles.giftNotificationDot} />}
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.levelText}>Cấp {progress.level}</Text>
      </View>

      {/* EXP Progress Bar Pill */}
      <View style={styles.progressTrackWrapper}>
        <View style={styles.trackBackground}>
          <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />
          <Text style={styles.xpProgressText}>
            {progress.currentXp}/{progress.maxXp} XP
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 22,
    color: '#FF7158',
  },
  streakCol: {
    alignItems: 'center',
  },
  streakLabel: {
    fontFamily: flameeFonts.bold,
    fontSize: 18,
    color: '#FF7158',
    lineHeight: 20,
  },
  streakBigNum: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 36,
    color: '#FF7158',
    lineHeight: 38,
  },
  mascotStage: {
    width: '100%',
    height: 185,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  mascotImage: {
    width: 175,
    height: 175,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  giftTouchable: {
    padding: 4,
  },
  giftBoxWrapper: {
    position: 'relative',
  },
  giftNotificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  levelText: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    color: '#FF7158',
  },
  progressTrackWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trackBackground: {
    width: '100%',
    height: 34,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FF7158',
    borderRadius: 17,
  },
  xpProgressText: {
    fontFamily: flameeFonts.bold,
    fontSize: 14,
    color: '#2B2B2B',
    zIndex: 2,
  },
});
