import React, { useState } from 'react';
import {
  ImageBackground,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { flameeFonts } from '@/shared/constants/flameeTheme';
import { brandAssets } from '@/shared/assets/brandAssets';
import type { DateItem, DateStatus } from '@/features/dates/types';

export type DateDetailModalProps = {
  item: DateItem | null;
  visible: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: DateStatus) => void;
  onDelete: (id: string) => void;
};

export function DateDetailModal({
  item,
  visible,
  onClose,
  onUpdateStatus,
  onDelete,
}: DateDetailModalProps) {
  const [selectedDayId, setSelectedDayId] = useState<string>('sat');

  if (!item) return null;

  const mockWeekDays = [
    { id: 'mon', label: 'T2', date: '9', active: false },
    { id: 'tue', label: 'T3', date: '10', active: false },
    { id: 'wed', label: 'T4', date: '11', active: false },
    { id: 'thu', label: 'T5', date: '12', active: false },
    { id: 'fri', label: 'T6', date: '13', active: false },
    { id: 'sat', label: 'T7', date: '14', active: selectedDayId === 'sat' },
    { id: 'sun', label: 'CN', date: '15', active: selectedDayId === 'sun' },
  ];

  const handleCancelDate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onUpdateStatus(item.id, 'cancelled');
    onClose();
  };

  const handleSelectDay = (dayId: string) => {
    Haptics.selectionAsync();
    setSelectedDayId(dayId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header Bar */}
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FF7158" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lịch hẹn hò</Text>
            <TouchableOpacity onPress={onClose} style={styles.addHeaderBtn}>
              <Ionicons name="close" size={24} color="#FF7158" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Title: Lịch hẹn sắp tới */}
          <Text style={styles.mainTitle}>Lịch hẹn sắp tới</Text>

          {/* Hero Card with Countdown (Mockup 3) */}
          <ImageBackground
            source={brandAssets.moodBienBackground}
            style={styles.heroCard}
            imageStyle={styles.heroCardImage}
          >
            <View style={styles.heroOverlay}>
              <Text style={styles.heroDate}>Thứ 7, 14 tháng 5</Text>
              <Text style={styles.heroTitle}>{item.title}</Text>
              <Text style={styles.heroLocation}>{item.location}</Text>

              {/* Countdown Glassmorphism */}
              <View style={styles.countdownContainer}>
                <View style={styles.countdownCol}>
                  <View style={styles.glassBox}>
                    <Text style={styles.glassNumber}>02</Text>
                  </View>
                  <Text style={styles.glassLabel}>Ngày</Text>
                </View>

                <Text style={styles.glassSeparator}>:</Text>

                <View style={styles.countdownCol}>
                  <View style={styles.glassBox}>
                    <Text style={styles.glassNumber}>02</Text>
                  </View>
                  <Text style={styles.glassLabel}>Giờ</Text>
                </View>

                <Text style={styles.glassSeparator}>:</Text>

                <View style={styles.countdownCol}>
                  <View style={styles.glassBox}>
                    <Text style={styles.glassNumber}>02</Text>
                  </View>
                  <Text style={styles.glassLabel}>Phút</Text>
                </View>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.cancelBtn}
                onPress={handleCancelDate}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* Month Header */}
          <Text style={styles.monthTitle}>Tháng 5, 2025</Text>

          {/* Week Day Pill Bar */}
          <View style={styles.weekCard}>
            {mockWeekDays.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={styles.weekCol}
                onPress={() => handleSelectDay(day.id)}
              >
                <Text style={[styles.weekLabel, day.active && styles.weekLabelActive]}>
                  {day.label}
                </Text>
                <View style={[styles.dateCircle, day.active && styles.dateCircleActive]}>
                  <Text style={[styles.dateText, day.active && styles.dateTextActive]}>
                    {day.date}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Section: Chưa biết làm gì tuần này ? */}
          <View style={styles.ideaQuestionSection}>
            <Text style={styles.ideaQuestionTitle}>Chưa biết làm gì tuần này ?</Text>
            <View style={styles.ideaBoxesRow}>
              <View style={styles.ideaBoxPlaceholder} />
              <View style={styles.ideaBoxPlaceholder} />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 22,
    color: '#FF7158',
  },
  addHeaderBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  mainTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 28,
    color: '#FF7158',
    marginBottom: 16,
  },

  // Hero Card
  heroCard: {
    width: '100%',
    minHeight: 260,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroCardImage: {
    borderRadius: 24,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(100, 30, 10, 0.45)',
    padding: 20,
    justifyContent: 'space-between',
  },
  heroDate: {
    fontFamily: flameeFonts.medium,
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  heroTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 26,
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroLocation: {
    fontFamily: flameeFonts.medium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
  },

  // Countdown Glassmorphism
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
  },
  countdownCol: {
    alignItems: 'center',
    gap: 4,
  },
  glassBox: {
    width: 64,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassNumber: {
    fontFamily: flameeFonts.bold,
    fontSize: 26,
    color: '#FFFFFF',
  },
  glassLabel: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  glassSeparator: {
    fontFamily: flameeFonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: -16,
  },

  // Cancel Button
  cancelBtn: {
    width: '100%',
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  cancelBtnText: {
    fontFamily: flameeFonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Month & Week
  monthTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 20,
    color: '#FF7158',
    marginBottom: 12,
  },
  weekCard: {
    width: '100%',
    height: 64,
    backgroundColor: '#FFF1E4',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  weekCol: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  weekLabel: {
    fontFamily: flameeFonts.medium,
    fontSize: 12,
    color: '#888888',
  },
  weekLabelActive: {
    color: '#FF7158',
    fontFamily: flameeFonts.bold,
  },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: {
    backgroundColor: '#FF7158',
  },
  dateText: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#2B2B2B',
  },
  dateTextActive: {
    color: '#FFFFFF',
  },

  // Idea Section
  ideaQuestionSection: {
    marginBottom: 20,
  },
  ideaQuestionTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 20,
    color: '#FF7158',
    marginBottom: 14,
  },
  ideaBoxesRow: {
    flexDirection: 'row',
    gap: 14,
  },
  ideaBoxPlaceholder: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
  },
});

