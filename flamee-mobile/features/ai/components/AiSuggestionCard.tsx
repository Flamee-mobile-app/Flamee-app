import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/shared/components/ui';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import type { AiSuggestion } from '@/features/ai/types';

export type AiSuggestionCardProps = {
  suggestion: AiSuggestion;
  onPress: () => void;
};

export function AiSuggestionCard({ suggestion, onPress }: AiSuggestionCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.icon} />
      <View style={styles.copy}>
        <AppText variant="body">{suggestion.title}</AppText>
        <AppText variant="caption" color={flameeTheme.colors.text.secondary}>
          {suggestion.prompt}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: flameeTheme.spacing[3],
  },
  icon: {
    backgroundColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.full,
    height: 30,
    width: 30,
  },
  copy: {
    flex: 1,
    gap: flameeTheme.spacing[1],
  },
});
