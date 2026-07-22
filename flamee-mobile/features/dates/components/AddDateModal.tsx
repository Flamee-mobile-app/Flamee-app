import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { flameeFonts } from '@/shared/constants/flameeTheme';
import type { CreateDatePayload, DateCategory, DateIdea } from '@/features/dates/types';

import { FlameeCalendarPicker } from './FlameeCalendarPicker';

export type AddDateModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDatePayload) => void;
  prefillIdea?: DateIdea | null;
};

const CATEGORY_OPTIONS: { category: DateCategory; emoji: string; label: string }[] = [
  { category: 'movie', emoji: '🎬', label: 'Xem phim' },
  { category: 'food', emoji: '🍜', label: 'Ăn uống' },
  { category: 'picnic', emoji: '🧺', label: 'Picnic' },
  { category: 'walk', emoji: '🌃', label: 'Đi dạo' },
  { category: 'travel', emoji: '✈️', label: 'Du lịch' },
  { category: 'other', emoji: '💖', label: 'Khác' },
];

export function AddDateModal({
  visible,
  onClose,
  onSubmit,
  prefillIdea,
}: AddDateModalProps) {
  const [title, setTitle] = useState(prefillIdea?.title || '');
  const [location, setLocation] = useState(prefillIdea?.location || '');
  const [date, setDate] = useState('2026-05-18');
  const [time, setTime] = useState(prefillIdea?.time || '19:00');
  const [selectedCategory, setSelectedCategory] = useState<DateCategory>(
    prefillIdea?.category || 'food'
  );
  const [selectedEmoji, setSelectedEmoji] = useState(prefillIdea?.emoji || '🍜');
  const [note, setNote] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update states if prefillIdea changes
  React.useEffect(() => {
    if (prefillIdea) {
      setTitle(prefillIdea.title);
      setLocation(prefillIdea.location);
      setTime(prefillIdea.time);
      setSelectedCategory(prefillIdea.category || 'food');
      setSelectedEmoji(prefillIdea.emoji || '🍜');
    }
  }, [prefillIdea]);

  const handleSubmit = () => {
    if (!title.trim() || !location.trim()) {
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit({
      title: title.trim(),
      location: location.trim(),
      date,
      time,
      category: selectedCategory,
      emoji: selectedEmoji,
      note: note.trim() || undefined,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDate('2026-05-18');
    setTime('19:00');
    setSelectedCategory('food');
    setSelectedEmoji('🍜');
    setNote('');
    setShowDatePicker(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.floatingCardContainer}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>Tạo lịch hẹn mới 💖</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#FF7158" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.formScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Category Selector */}
              <Text style={styles.fieldLabel}>Chọn chủ đề hẹn hò</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {CATEGORY_OPTIONS.map((opt) => {
                  const active = selectedCategory === opt.category;
                  return (
                    <TouchableOpacity
                      key={opt.category}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedCategory(opt.category);
                        setSelectedEmoji(opt.emoji);
                      }}
                    >
                      <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Title Input */}
              <Text style={styles.fieldLabel}>Tên lịch hẹn *</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Picnic công viên"
                  placeholderTextColor="#A0A0A0"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Location Input */}
              <Text style={styles.fieldLabel}>Địa điểm *</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Công viên ven sông"
                  placeholderTextColor="#A0A0A0"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              {/* Date & Time Row */}
              <View style={styles.rowTwoCols}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Ngày hẹn</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.inputCardSmall}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowDatePicker(!showDatePicker);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#FF7158" />
                    <Text style={styles.pickerText}>{date}</Text>
                    <Ionicons
                      name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#FF7158"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Giờ hẹn</Text>
                  <View style={styles.inputCardSmall}>
                    <Ionicons name="time-outline" size={18} color="#FF7158" />
                    <TextInput
                      style={styles.textInputSmall}
                      value={time}
                      onChangeText={setTime}
                      placeholder="19:00"
                    />
                  </View>
                </View>
              </View>

              {/* Dynamic Flamee Calendar Picker Component */}
              {showDatePicker && (
                <FlameeCalendarPicker
                  selectedDate={date}
                  onSelectDate={(newDate) => {
                    setDate(newDate);
                    setShowDatePicker(false);
                  }}
                />
              )}


              {/* Note Input */}
              <Text style={styles.fieldLabel}>Lời nhắn nhủ gửi đối phương</Text>
              <View style={[styles.inputCard, styles.noteCard]}>
                <TextInput
                  style={[styles.textInput, styles.noteInput]}
                  placeholder="Nhắn vài câu tình cảm nè anh yêu..."
                  placeholderTextColor="#A0A0A0"
                  multiline
                  numberOfLines={3}
                  value={note}
                  onChangeText={setNote}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmit}
                style={styles.saveBtnWrapper}
              >
                <LinearGradient
                  colors={['#FCB76D', '#FF7158']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>Lưu lịch hẹn</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  floatingCardContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFF1E4',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#FFE6CE',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 20,
    color: '#FF7158',
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    paddingBottom: 8,
  },
  fieldLabel: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#2B2B2B',
    marginBottom: 6,
    marginTop: 10,
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipActive: {
    backgroundColor: '#FF7158',
    borderColor: '#FF7158',
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipText: {
    fontFamily: flameeFonts.medium,
    fontSize: 13,
    color: '#2B2B2B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.bold,
  },
  inputCard: {
    backgroundColor: 'rgba(255, 113, 88, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 88, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noteCard: {
    minHeight: 70,
  },
  textInput: {
    fontFamily: flameeFonts.medium,
    fontSize: 14,
    color: '#2B2B2B',
    padding: 0,
  },
  noteInput: {
    textAlignVertical: 'top',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  inputCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 113, 88, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 88, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerText: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#2B2B2B',
  },
  textInputSmall: {
    flex: 1,
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#2B2B2B',
    padding: 0,
  },


  // Dropdown Pickers
  pickerDropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownHeader: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#FF7158',
    marginBottom: 10,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calDayBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayBoxActive: {
    backgroundColor: '#FF7158',
  },
  calDayText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#2B2B2B',
  },
  calDayTextActive: {
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#FFF1E4',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeChipActive: {
    backgroundColor: '#FF7158',
  },
  timeChipText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#2B2B2B',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },

  saveBtnWrapper: {
    marginTop: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtn: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: flameeFonts.bold,
    fontSize: 16,
    color: '#FFE6CE',
  },
});


