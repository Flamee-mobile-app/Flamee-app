import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import type { UserProgress } from '@/features/missions/types';

interface StreakCalendarViewProps {
  progress: UserProgress;
  onBack: () => void;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const STREAK_DAYS = [10, 11, 12, 13]; // Mock highlighted streak days

type ChartFilterPeriod = 'week' | 'month';

export function StreakCalendarView({ progress, onBack }: StreakCalendarViewProps) {
  const [chartPeriod, setChartPeriod] = useState<ChartFilterPeriod>('week');

  const handleBack = () => {
    Haptics.selectionAsync();
    onBack();
  };

  const handleChartPeriodToggle = (period: ChartFilterPeriod) => {
    Haptics.selectionAsync();
    setChartPeriod(period);
  };

  // Generate 31 days grid
  const daysGrid = Array.from({ length: 31 }, (_, i) => i + 1);

  // Data for Chart Area
  const weekChartData = [
    { label: '9/5', value: 40, x: 30, y: 70 },
    { label: '10/5', value: 75, x: 95, y: 35 },
    { label: '11/5', value: 90, x: 160, y: 20 },
    { label: '12/5', value: 60, x: 225, y: 50 },
    { label: '13/5', value: 30, x: 290, y: 80 },
  ];

  const monthChartData = [
    { label: 'T1', value: 50, x: 30, y: 60 },
    { label: 'T2', value: 85, x: 95, y: 25 },
    { label: 'T3', value: 65, x: 160, y: 45 },
    { label: 'T4', value: 95, x: 225, y: 15 },
    { label: 'T5', value: 70, x: 290, y: 40 },
  ];

  const activeChartData = chartPeriod === 'week' ? weekChartData : monthChartData;

  // SVG Bezier Curves for Area Chart
  const areaPathD =
    chartPeriod === 'week'
      ? 'M 30,70 C 62,35 62,35 95,35 C 127,20 127,20 160,20 C 192,50 192,50 225,50 C 257,80 257,80 290,80 L 290,105 L 30,105 Z'
      : 'M 30,60 C 62,25 62,25 95,25 C 127,45 127,45 160,45 C 192,15 192,15 225,15 C 257,40 257,40 290,40 L 290,105 L 30,105 Z';

  const strokePathD =
    chartPeriod === 'week'
      ? 'M 30,70 C 62,35 62,35 95,35 C 127,20 127,20 160,20 C 192,50 192,50 225,50 C 257,80 257,80 290,80'
      : 'M 30,60 C 62,25 62,25 95,25 C 127,45 127,45 160,45 C 192,15 192,15 225,15 C 257,40 257,40 290,40';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header with Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#FF7158" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuỗi Hoàn Thành</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Streak Big Counter Banner */}
      <View style={styles.streakBanner}>
        <View style={styles.streakLeftCol}>
          <Text style={styles.streakLabel}>CHUỖI HIỆN TẠI</Text>
          <View style={styles.numberRow}>
            <Text style={styles.streakBigNum}>{progress.streakDays || 3}</Text>
            <Text style={styles.streakUnit}>ngày liên tiếp</Text>
          </View>
        </View>
        <View style={styles.fireCircle}>
          <Text style={styles.fireEmoji}>🔥</Text>
        </View>
      </View>

      {/* Month Calendar Card */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarMonthRow}>
          <Text style={styles.monthTitle}>Tháng 5, 2026</Text>
          <Text style={styles.streakSummaryText}>3/30 ngày hoàn thành</Text>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((wd) => (
            <Text key={wd} style={styles.weekdayText}>
              {wd}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.grid}>
          {daysGrid.map((day) => {
            const isStreak = STREAK_DAYS.includes(day);
            return (
              <View key={day} style={styles.dayCell}>
                <View style={[styles.dayCircle, isStreak && styles.dayCircleActive]}>
                  <Text style={[styles.dayText, isStreak && styles.dayTextActive]}>
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Streak Chart Section - Area Chart (Biểu Đồ Miền) */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Biểu đồ chuỗi</Text>

          {/* Filter Options for Area Chart */}
          <View style={styles.periodFilterRow}>
            <TouchableOpacity
              onPress={() => handleChartPeriodToggle('week')}
              style={[styles.filterChip, chartPeriod === 'week' && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, chartPeriod === 'week' && styles.filterChipTextActive]}>
                Tuần này
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleChartPeriodToggle('month')}
              style={[styles.filterChip, chartPeriod === 'month' && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, chartPeriod === 'month' && styles.filterChipTextActive]}>
                Tháng này
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SVG Area Chart (Biểu đồ miền) */}
        <View style={styles.svgChartWrapper}>
          <Svg width="100%" height={140} viewBox="0 0 320 140">
            <Defs>
              <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FF7158" stopOpacity={0.45} />
                <Stop offset="100%" stopColor="#FFF1E4" stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            {/* Filled Area Gradient */}
            <Path d={areaPathD} fill="url(#areaGradient)" />

            {/* Stroke Line */}
            <Path d={strokePathD} fill="none" stroke="#FF7158" strokeWidth={3.5} strokeLinecap="round" />

            {/* Glowing Data Point Circles */}
            {activeChartData.map((pt) => (
              <Circle
                key={pt.label}
                cx={pt.x}
                cy={pt.y}
                r={5}
                fill="#FF7158"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}
          </Svg>

          {/* Date Labels below Area Chart */}
          <View style={styles.chartLabelsRow}>
            {activeChartData.map((pt) => (
              <Text key={pt.label} style={styles.chartLabelText}>
                {pt.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
    gap: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 20,
    color: '#FF7158',
  },
  streakBanner: {
    backgroundColor: '#FFF1E4',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFE6CE',
  },
  streakLeftCol: {
    gap: 4,
  },
  streakLabel: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#888888',
    letterSpacing: 0.5,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  streakBigNum: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 48,
    color: '#FF7158',
    lineHeight: 52,
  },
  streakUnit: {
    fontFamily: flameeFonts.bold,
    fontSize: 15,
    color: '#2B2B2B',
  },
  fireCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FCB76D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireEmoji: {
    fontSize: 32,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    gap: 12,
  },
  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    color: '#FF7158',
  },
  streakSummaryText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#888888',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayText: {
    width: '14%',
    textAlign: 'center',
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#888888',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9F7',
  },
  dayCircleActive: {
    backgroundColor: '#FF7158',
  },
  dayText: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#2B2B2B',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    gap: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    color: '#FF7158',
  },
  periodFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#FFF1E4',
  },
  filterChipActive: {
    backgroundColor: '#FF7158',
  },
  filterChipText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#FF7158',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  svgChartWrapper: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  chartLabelText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#888888',
  },
});
