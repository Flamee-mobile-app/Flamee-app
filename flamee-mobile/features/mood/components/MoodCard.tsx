import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/ui';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import type { MoodOption } from '@/features/mood/types';

export type MoodCardProps = {
  mood: MoodOption;
  selected?: boolean;
  onPress?: () => void;
};

export function MoodCard({ mood, selected = false, onPress }: MoodCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: mood.color }, selected && styles.selected]}>
      <View style={styles.dot} />
      <View style={styles.copy}>
        <AppText variant="body">{mood.label}</AppText>
        <AppText variant="caption" color={flameeTheme.colors.text.secondary}>
          {mood.description}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: 'transparent',
    borderRadius: flameeTheme.radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: flameeTheme.spacing[3],
    padding: flameeTheme.spacing[4],
  },
  selected: {
    borderColor: flameeTheme.colors.brand,
  },
  dot: {
    backgroundColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.full,
    height: 14,
    marginTop: 3,
    width: 14,
  },
  copy: {
    flex: 1,
    gap: flameeTheme.spacing[1],
  },
});
