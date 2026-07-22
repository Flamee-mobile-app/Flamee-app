import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import { FlameeIcon } from '@/shared/components/icons';

interface RewardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RewardModal({ visible, onClose }: RewardModalProps) {
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Dark Backdrop */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1}>
          <View style={styles.backdrop} />
        </TouchableOpacity>

        {/* Center Celebration Card Modal (No bottom sheet, no float, no mascot tilt) */}
        <View style={styles.modalCard}>
          {/* Header Row: Title Badge & Close Button */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBadge}>
              <Text style={styles.headerBadgeText}>PHẦN THƯỞNG ĐẶC BIỆT 🎁</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Victory Stage Area: Centered Mascot + Pedestal */}
          <View style={styles.stageArea}>
            {/* Sparkle Confetti */}
            <View style={styles.sparkleContainer}>
              <Text style={[styles.sparkleItem, { top: 0, left: 16 }]}>✨</Text>
              <Text style={[styles.sparkleItem, { top: 10, right: 18 }]}>⭐</Text>
              <Text style={[styles.sparkleItem, { bottom: 20, left: 24 }]}>🌟</Text>
              <Text style={[styles.sparkleItem, { bottom: 16, right: 26 }]}>🎉</Text>
            </View>

            {/* Mascot Image (Straight & centered, NO rotation/tilt!) */}
            <View style={styles.mascotWrapper}>
              <Image
                source={require('@/assets/images/mascot/emotion_08_om_mieng_coi.png')}
                style={styles.mascotImage}
                resizeMode="contain"
              />
            </View>

            {/* Victory Stage Pedestal */}
            <View style={styles.stagePedestal}>
              <LinearGradient
                colors={['#FFE6CE', '#FCB76D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pedestalGradient}
              >
                <FlameeIcon name="logo" size={16} color="#FF7158" />
                <Text style={styles.pedestalText}>VICTORY STAGE</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Celebration Card Message Container */}
          <View style={styles.messageCard}>
            <View style={styles.congratRow}>
              <Text style={styles.partyEmoji}>🎉</Text>
              <Text style={styles.congratTitle}>Chúc mừng bạn!</Text>
              <Text style={styles.partyEmoji}>✨</Text>
            </View>

            <Text style={styles.rewardMessageText}>
              Chúc mừng bạn đã nhận được một mascot, vui lòng liên hệ qua các kênh social để nhận quà nhé!
            </Text>
          </View>

          {/* Shiny Action Button */}
          <TouchableOpacity onPress={handleClose} activeOpacity={0.85} style={styles.claimButton}>
            <LinearGradient
              colors={['#FF7158', '#E0533C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.claimButtonText}>Nhận quà ngay</Text>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 8, 0.65)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FFE6CE',
  },
  headerBadgeText: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 13,
    color: '#FF7158',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAF9F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE6CE',
  },
  stageArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  sparkleItem: {
    position: 'absolute',
    fontSize: 22,
  },
  mascotWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  mascotImage: {
    width: 155,
    height: 155,
  },
  stagePedestal: {
    width: 190,
    height: 32,
    borderRadius: 16,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#FCB76D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  pedestalGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  pedestalText: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 12,
    color: '#2B2B2B',
    letterSpacing: 1,
  },
  messageCard: {
    width: '100%',
    backgroundColor: '#FFF1E4',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    alignItems: 'center',
    marginVertical: 14,
  },
  congratRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  partyEmoji: {
    fontSize: 20,
  },
  congratTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 20,
    color: '#FF7158',
  },
  rewardMessageText: {
    fontFamily: flameeFonts.bold,
    fontSize: 14,
    color: '#444444',
    textAlign: 'center',
    lineHeight: 21,
  },
  claimButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  claimButtonText: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
});
