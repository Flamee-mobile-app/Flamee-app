import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { TIMELINE_LAYOUT } from '@/features/timeline/timelineLayout';

export type TimelineChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function TimelineChip({
  label,
  selected,
  onPress,
  accessibilityLabel = label,
}: TimelineChipProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      style={[styles.chip, selected && styles.selectedChip]}>
      <AppText
        color={
          selected
            ? flameeTheme.colors.text.inverse
            : flameeTheme.colors.brand
        }
        style={styles.label}
        variant="bodySmall">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: TIMELINE_LAYOUT.actionMinHeight,
    paddingHorizontal: flameeTheme.spacing[4],
    paddingVertical: flameeTheme.spacing[2],
  },
  label: {
    fontWeight: '600',
  },
  selectedChip: {
    backgroundColor: flameeTheme.colors.brand,
    borderColor: flameeTheme.colors.brand,
  },
});
