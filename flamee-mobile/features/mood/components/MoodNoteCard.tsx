import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { flameeFonts } from '@/shared/constants/flameeTheme';

interface MoodNoteCardProps {
  note: string;
  onChangeNote: (text: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function MoodNoteCard({
  note,
  onChangeNote,
  onSubmit,
  isSubmitting = false,
}: MoodNoteCardProps) {
  const maxLength = 150;

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit();
  };

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Lời nhắn gửi đối phương 💕</Text>
        <Text style={styles.charCount}>
          {note.length}/{maxLength}
        </Text>
      </View>

      {/* Input Box Card */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.textInput}
          placeholder="Nhắn nhủ điều gì đó dễ thương cho người ấy hôm nay nhé..."
          placeholderTextColor="rgba(43, 43, 43, 0.4)"
          value={note}
          onChangeText={(text) => {
            if (text.length <= maxLength) {
              onChangeNote(text);
            }
          }}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Save & Send Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitBtnWrapper}
      >
        <LinearGradient
          colors={['#FCB76D', '#FF7158']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitText}>Cập nhật Mood & Gửi ✨</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FAF9F7',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    color: '#FF7158',
  },
  charCount: {
    fontFamily: flameeFonts.medium,
    fontSize: 12,
    color: '#888888',
  },
  inputCard: {
    backgroundColor: '#FFF1E4',
    borderWidth: 1.5,
    borderColor: '#FFE6CE',
    borderRadius: 20,
    padding: 16,
    minHeight: 110,
  },
  textInput: {
    fontFamily: flameeFonts.medium,
    fontSize: 14,
    color: '#2B2B2B',
    lineHeight: 22,
    minHeight: 80,
  },
  submitBtnWrapper: {
    width: '100%',
    borderRadius: 26,
    elevation: 4,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginTop: 4,
  },
  submitGradient: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: flameeFonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
