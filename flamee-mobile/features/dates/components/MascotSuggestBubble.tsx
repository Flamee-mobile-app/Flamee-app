import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { flameeFonts } from '@/shared/constants/flameeTheme';
import { MascotArtwork } from '@/features/mascot/components/MascotArtwork';
import { MascotMessageDismissLayer } from '@/features/mascot/components/MascotMessageDismissLayer';
import { useMascotMessageMotion } from '@/features/mascot/hooks/useMascotMessageMotion';

export type MascotSuggestBubbleProps = {
  onPressChat: () => void;
  messageText?: string;
  defaultExpanded?: boolean;
};

export function MascotSuggestBubble({
  onPressChat,
  messageText = 'Chưa có ý tưởng cho cuộc hẹn? nhờ tớ tư vấn nhé :3',
  defaultExpanded = false,
}: MascotSuggestBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { collapsedBadgeStyle, expandedBubbleStyle, shouldRenderExpandedBubble } =
    useMascotMessageMotion(isExpanded);

  const open = () => {
    Haptics.selectionAsync();
    setIsExpanded(true);
  };

  const close = () => {
    Haptics.selectionAsync();
    setIsExpanded(false);
  };

  const toggleExpand = () => {
    if (isExpanded) {
      close();
      return;
    }

    open();
  };

  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPressChat();
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {isExpanded && <MascotMessageDismissLayer onDismiss={close} />}

      <View pointerEvents="box-none" style={styles.container}>
        {/* Expanded Speech Card */}
        {shouldRenderExpandedBubble && (
          <Animated.View
            pointerEvents={isExpanded ? 'auto' : 'none'}
            style={[styles.expandedBubble, expandedBubbleStyle]}
            testID="mascot-suggest-expanded-bubble">
            <View style={styles.expandedContent}>
            <View style={styles.headerRow}>
              <View style={styles.mascotTag}>
                <Ionicons name="sparkles" size={12} color="#FF7158" />
                <Text style={styles.mascotTagText}>Mascot AI</Text>
              </View>
              <View style={styles.closeMiniBtnSlot}>
                <TouchableOpacity
                  accessibilityLabel="Đóng gợi ý lịch hẹn hò"
                  accessibilityRole="button"
                  onPress={close}
                  style={styles.closeMiniBtn}>
                  <Ionicons name="close-circle" size={18} color="#FF7158" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.messageText}>{messageText}</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleOpenChat}
              style={styles.actionRow}
              testID="mascot-suggest-chat-action">
              <Text style={styles.actionText}>Hỏi tớ ngay</Text>
              <Ionicons name="arrow-forward-circle" size={18} color="#FF7158" />
            </TouchableOpacity>
            </View>
            <View style={styles.speechArrow} />
          </Animated.View>
        )}

        {/* Collapsed Ellipses Badge (...) */}
        {!isExpanded && (
          <Animated.View
            style={[styles.collapsedBadgeContainer, collapsedBadgeStyle]}
            testID="mascot-suggest-collapsed-badge">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={open}
              style={styles.collapsedBadge}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#FF7158" />
            </TouchableOpacity>
            <View style={styles.collapsedArrow} />
          </Animated.View>
        )}

        {/* Mascot Avatar Trigger */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleExpand}
          style={styles.mascotBtn}
          testID="mascot-suggest-trigger">
          <MascotArtwork mood="happy" size={56} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 99,
  },

  // Expanded Speech Bubble
  expandedBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFE6CE',
    maxWidth: 240,
    marginBottom: 10,
    marginRight: 4,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  expandedContent: {
    padding: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mascotTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1E4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  mascotTagText: {
    fontFamily: flameeFonts.bold,
    fontSize: 11,
    color: '#FF7158',
  },
  closeMiniBtnSlot: {
    height: 22,
    width: 22,
  },
  closeMiniBtn: {
    position: 'absolute',
    top: -11,
    left: -11,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontFamily: flameeFonts.medium,
    fontSize: 13,
    color: '#2B2B2B',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  actionText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#FF7158',
  },
  speechArrow: {
    position: 'absolute',
    bottom: -8,
    right: 22,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },

  // Collapsed Ellipses Badge
  collapsedBadgeContainer: {
    bottom: 48,
    position: 'absolute',
    right: 40,
    zIndex: 1,
  },
  collapsedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFE6CE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  collapsedArrow: {
    position: 'absolute',
    bottom: -6,
    right: 14,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },



  // Mascot Avatar Button
  mascotBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF1E4',
    borderWidth: 2,
    borderColor: '#FF7158',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
