import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brandAssets } from '@/shared/assets';
import { AppImage } from '@/shared/components/media';
import { AppText } from '@/shared/components/ui';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import { useAppSafeArea } from '@/shared/hooks';

import { useMoodCheckin } from '../hooks/useMoodCheckin';
import type { MoodEntry } from '../types';
import { MascotThreeCarousel } from './MascotThreeCarousel';
import { MoodNoteCard } from './MoodNoteCard';

type MoodCheckinModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (entry: MoodEntry) => void;
  initialMoodId?: string;
};

export function MoodCheckinModal({
  visible,
  onClose,
  onSuccess,
  initialMoodId = 'great',
}: MoodCheckinModalProps) {
  const safeArea = useAppSafeArea();
  const checkin = useMoodCheckin(initialMoodId);

  const handleClose = () => {
    checkin.reset();
    onClose();
  };

  const handleSubmit = async () => {
    await checkin.submit((entry) => {
      onSuccess?.(entry);
      handleClose();
    });
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
      testID="mood-checkin-modal"
      visible={visible}
    >
      <View style={styles.container}>
        {/* Fullscreen Figma Biển 2 Background Image */}
        <AppImage
          contentFit="cover"
          source={brandAssets.moodBienBackground}
          style={StyleSheet.absoluteFillObject}
          transition={200}
        />

        {/* Dark Overlay */}
        <View style={styles.darkOverlay} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Header */}
            <View style={[styles.topHeader, { paddingTop: safeArea.top + 8 }]}>
              <Pressable
                accessibilityLabel="Đóng"
                accessibilityRole="button"
                onPress={handleClose}
                style={styles.closeBtn}
              >
                <Ionicons color="#FFFFFF" name="chevron-back" size={26} />
              </Pressable>

              {/* Header Pill Badge */}
              <View style={styles.headerPillBadge}>
                <AppText style={styles.headerPillText}>Mood check-in</AppText>
              </View>

              <View style={styles.closeBtnPlaceholder} />
            </View>

            {/* Subtitle */}
            <View style={styles.subtitleWrapper}>
              <AppText style={styles.subtitleText}>Hôm nay bạn cảm thấy thế nào?</AppText>
            </View>

            {/* Layout 1: Mascot Stage (3-Mascot Carousel: Left, Center Enlarged, Right) */}
            <View style={styles.layout1Stage}>
              <MascotThreeCarousel
                options={checkin.options}
                selectedIndex={checkin.selectedIndex}
                onSelectIndex={checkin.selectMoodByIndex}
                onDoubleClickSelect={(index) => {
                  checkin.selectMoodByIndex(index);
                }}
              />
            </View>

            {/* Layout 2: Clean & Premium Note Input Section */}
            <View style={[styles.layout2NoteSection, { paddingBottom: safeArea.bottom + 20 }]}>
              <MoodNoteCard
                note={checkin.note}
                onChangeNote={checkin.setNote}
                onSubmit={handleSubmit}
                isSubmitting={checkin.isSubmitting}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeBtnPlaceholder: {
    width: 40,
  },
  headerPillBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 113, 88, 0.28)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 40,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerPillText: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 22,
  },
  subtitleWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  subtitleText: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  layout1Stage: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layout2NoteSection: {
    width: '100%',
    backgroundColor: '#FAF9F7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
});
