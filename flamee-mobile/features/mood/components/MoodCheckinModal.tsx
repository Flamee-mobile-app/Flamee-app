import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { MascotArtwork } from '@/features/mascot/components/MascotArtwork';
import { brandAssets } from '@/shared/assets';
import { AppImage } from '@/shared/components/media';
import { AppText } from '@/shared/components/ui';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import { useAppSafeArea } from '@/shared/hooks';

import { useMoodCheckin } from '../hooks/useMoodCheckin';
import type { MoodCheckinItem, MoodEntry } from '../types';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

const ITEM_WIDTH = 100;
const SIDE_PADDING = (WINDOW_WIDTH - ITEM_WIDTH) / 2;

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
  initialMoodId = 'happy_great',
}: MoodCheckinModalProps) {
  const safeArea = useAppSafeArea();
  const checkin = useMoodCheckin(initialMoodId);
  const scrollRef = useRef<ScrollView>(null);

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    if (index >= 0 && index < checkin.options.length && index !== checkin.selectedIndex) {
      checkin.selectMoodByIndex(index);
    }
  };

  const handleSelectOption = (index: number) => {
    checkin.selectMoodByIndex(index);
    scrollRef.current?.scrollTo({ x: index * ITEM_WIDTH, animated: true });
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
      testID="mood-checkin-modal"
      visible={visible}>
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

        {/* Main Keyboard & Screen Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          {/* Top Bar with Back Button */}
          <View style={[styles.topHeader, { paddingTop: safeArea.top + 8 }]}>
            <Pressable
              accessibilityLabel="Đóng"
              accessibilityRole="button"
              onPress={handleClose}
              style={styles.closeBtn}>
              <Ionicons color="#FFFFFF" name="chevron-back" size={26} />
            </Pressable>

            {/* Figma Node 6528:7308 Header Pill Badge (width: 262px, height: 46px) */}
            <View style={styles.headerPillBadge}>
              <AppText style={styles.headerPillText}>Mood check-in</AppText>
            </View>

            <View style={styles.closeBtnPlaceholder} />
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleWrapper}>
            <AppText style={styles.subtitleText}>Hôm nay bạn cảm thấy thế nào?</AppText>
          </View>

          {/* Mascot Parabolic Arc Wheel Section */}
          <View style={styles.arcWheelSection}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{
                paddingHorizontal: SIDE_PADDING,
                alignItems: 'flex-start',
                height: 180,
              }}
              decelerationRate="fast"
              horizontal
              onMomentumScrollEnd={handleScroll}
              showsHorizontalScrollIndicator={false}
              snapToAlignment="center"
              snapToInterval={ITEM_WIDTH}>
              {checkin.options.map((item: MoodCheckinItem, index: number) => {
                const dist = index - checkin.selectedIndex;
                const absDist = Math.abs(dist);
                const isCenter = dist === 0;

                // Parabolic Arc Offset (U-shape Curve)
                const translateY = Math.pow(absDist, 1.4) * 22;
                const opacity = isCenter ? 1.0 : Math.max(0.35, 0.6 - absDist * 0.12);

                return (
                  <Pressable
                    key={item.id}
                    accessibilityLabel={`Chọn cảm xúc ${item.label}`}
                    accessibilityRole="button"
                    onPress={() => handleSelectOption(index)}
                    style={[
                      styles.carouselItem,
                      {
                        width: ITEM_WIDTH,
                        transform: [{ translateY }],
                        opacity,
                      },
                    ]}>
                    <View
                      style={[
                        styles.circleBubble,
                        isCenter ? styles.circleBubbleCenter : styles.circleBubbleSide,
                      ]}>
                      <MascotArtwork mood={item.mood} size={isCenter ? 72 : 36} />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Selected Mood Label Center */}
            <View style={styles.selectedLabelWrapper}>
              <AppText style={styles.selectedLabelText} testID="selected-mood-label">
                {checkin.selectedOption.label}
              </AppText>
            </View>
          </View>

          <View style={styles.flexSpacer} />

          {/* Bottom Curved Sheet (#FFF1E4) Area */}
          <View style={styles.bottomAreaContainer}>
            {/* Smooth Circle Dome Arc background (#FFF1E4) */}
            <View style={styles.circleDomeBg} />

            {/* Content Area */}
            <View style={[styles.sheetContent, { paddingBottom: safeArea.bottom + 16 }]}>
              {/* Title */}
              <AppText style={styles.sheetTitle}>
                Hãy viết lời nhắn nhủ{'\n'}đến đối phương nhé!
              </AppText>

              {/* Input Card Container (Frame 322: 294px x 136px) */}
              <View style={styles.inputCard}>
                <TextInput
                  accessibilityLabel="Nhập lời nhắn nhủ đến đối phương"
                  multiline
                  numberOfLines={4}
                  onChangeText={checkin.setNote}
                  placeholder="Hãy viết vài lời nhắn nhủ đến đối phương nhé"
                  placeholderTextColor="rgba(85, 85, 85, 0.5)"
                  style={styles.textInput}
                  textAlignVertical="top"
                  value={checkin.note}
                />
              </View>

              {/* Save Button (Frame 234: 294px x 40px, borderRadius: 32px) */}
              <Pressable
                accessibilityLabel="Lưu cảm xúc"
                accessibilityRole="button"
                disabled={checkin.isSubmitting}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.saveBtnWrapper,
                  (pressed || checkin.isSubmitting) && styles.saveBtnPressed,
                ]}>
                <LinearGradient colors={['#FCB76D', '#FF7158']} style={styles.saveBtnGradient}>
                  {checkin.isSubmitting ? (
                    <ActivityIndicator color="#FFE6CE" size="small" />
                  ) : (
                    <AppText style={styles.saveBtnText}>Lưu</AppText>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  arcWheelSection: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
    marginTop: 8,
  },
  bottomAreaContainer: {
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  circleBubble: {
    alignItems: 'center',
    borderRadius: 54,
    justifyContent: 'center',
  },
  circleBubbleCenter: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 54,
    borderWidth: 1.5,
    elevation: 10,
    height: 108,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    width: 108,
  },
  circleBubbleSide: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  circleDomeBg: {
    backgroundColor: '#FFF1E4',
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    top: 0,
  },
  carouselItem: {
    alignItems: 'center',
    justifyContent: 'center',
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
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    ...StyleSheet.absoluteFillObject,
  },
  flexSpacer: {
    flex: 1,
  },
  headerPillBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 113, 88, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 40,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: 240,
  },
  headerPillText: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 26,
  },
  inputCard: {
    backgroundColor: 'rgba(255, 113, 88, 0.18)',
    borderRadius: 24,
    minHeight: 124,
    padding: 16,
    width: 294,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  saveBtnGradient: {
    alignItems: 'center',
    borderRadius: 32,
    height: 42,
    justifyContent: 'center',
    width: '100%',
  },
  saveBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveBtnText: {
    color: '#FFE6CE',
    fontFamily: flameeFonts.bold,
    fontSize: 16,
  },
  saveBtnWrapper: {
    alignSelf: 'center',
    borderRadius: 32,
    elevation: 4,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    width: 294,
  },
  selectedLabelText: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 19,
    letterSpacing: 0.4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    textAlign: 'center',
  },
  selectedLabelWrapper: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    marginTop: 8,
  },
  sheetContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 32,
    width: '100%',
    zIndex: 2,
  },
  sheetTitle: {
    color: '#FF7158',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitleText: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    textAlign: 'center',
  },
  subtitleWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  textInput: {
    color: '#2B2B2B',
    fontFamily: flameeFonts.medium,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 92,
  },
  topHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});
