import { Pressable, StyleSheet, View } from 'react-native';

import { FlameeIcon } from '@/shared/components/icons';
import { AppText } from '@/shared/components/ui';
import { flameeTheme } from '@/shared/constants/flameeTheme';

import { MASCOT_VISUAL_SIZE } from '../mascotLayout';
import type { MascotHaloLayout } from '../mascotLayout';
import type { MascotAction, MascotNudge } from '../types';

type MascotActionHaloProps = {
  layout: MascotHaloLayout;
  nudge: MascotNudge;
  onAction: (action: MascotAction) => void;
};

export function MascotActionHalo({ layout, nudge, onAction }: MascotActionHaloProps) {
  const getActionLabel = (action: MascotAction) => {
    if (action.id === 'mood') return 'Mood check';
    if (action.id === 'ai') return 'Chat AI';
    return action.label;
  };

  return (
    <View accessibilityRole="menu" pointerEvents="box-none" style={styles.layer} testID="mascot-action-halo">
      <View
        accessible
        accessibilityLabel={`Flamee gợi ý: ${nudge.message}`}
        style={[
          styles.bubbleCard,
          {
            bottom: MASCOT_VISUAL_SIZE + 10,
            right: 0,
            width: layout.bubble.width,
          },
        ]}>
        {/* Tail pointing directly down to mascot */}
        <View style={styles.tail} />

        {/* Top Header Tag */}
        <View style={styles.headerTagRow}>
          <View style={styles.badgeTag}>
            <AppText style={styles.badgeTagText}>Flamee</AppText>
          </View>
        </View>

        {/* Full Message Content (Up to 3 lines, un-truncated & sharp typography) */}
        <View style={styles.messageContainer}>
          <AppText numberOfLines={3} style={styles.message} testID="mascot-halo-message" variant="body">
            {nudge.message}
          </AppText>
        </View>

        {/* Labeled Quick Navigation Action Pills */}
        {nudge.actions.length > 0 && (
          <View style={styles.actionsRow}>
            {nudge.actions.map((action) => (
              <Pressable
                key={action.id}
                accessibilityLabel={action.label}
                accessibilityRole="button"
                onPress={() => onAction(action)}
                style={({ pressed }) => [styles.actionPill, pressed && styles.actionPillPressed]}>
                <FlameeIcon color="#FF7158" name={action.id} size={15} />
                <AppText style={styles.actionPillText}>{getActionLabel(action)}</AppText>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionPill: {
    alignItems: 'center',
    backgroundColor: '#FFF1EE',
    borderColor: 'rgba(255, 113, 88, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionPillPressed: {
    backgroundColor: '#FFE4DD',
    transform: [{ scale: 0.96 }],
  },
  actionPillText: {
    color: '#FF7158',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(255, 113, 88, 0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  badgeTag: {
    backgroundColor: '#FFF1EE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTagText: {
    color: '#FF7158',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bubbleCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 113, 88, 0.35)',
    borderRadius: 20,
    borderWidth: 1.5,
    elevation: 10,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  headerTagRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  layer: {
    height: MASCOT_VISUAL_SIZE,
    position: 'absolute',
    width: MASCOT_VISUAL_SIZE,
  },
  message: {
    color: '#2B2B2B',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  messageContainer: {
    paddingVertical: 2,
  },
  tail: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(255, 113, 88, 0.35)',
    borderBottomWidth: 1.5,
    borderRightColor: 'rgba(255, 113, 88, 0.35)',
    borderRightWidth: 1.5,
    bottom: -6,
    height: 11,
    position: 'absolute',
    right: 24,
    transform: [{ rotate: '45deg' }],
    width: 11,
  },
});


