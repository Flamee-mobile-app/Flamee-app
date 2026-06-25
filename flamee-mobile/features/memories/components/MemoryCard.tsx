import { StyleSheet, View } from 'react-native';

import { AppText, Card, ImageTile } from '@/components/ui';
import { flameeTheme } from '@/constants/flameeTheme';

import type { MemoryItem } from '@/features/memories/types';

export type MemoryCardProps = {
  memory: MemoryItem;
  compact?: boolean;
};

export function MemoryCard({ memory, compact = false }: MemoryCardProps) {
  return (
    <Card style={compact ? styles.compactCard : styles.card}>
      <ImageTile label={memory.imageLabel} height={compact ? 96 : 130} />
      <View style={styles.copy}>
        <AppText variant={compact ? 'body' : 'sectionTitle'}>{memory.title}</AppText>
        <AppText variant="caption" color={flameeTheme.colors.text.secondary}>
          {memory.date}
        </AppText>
        {!compact ? (
          <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary}>
            {memory.description}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: flameeTheme.spacing[3],
  },
  compactCard: {
    flex: 1,
    gap: flameeTheme.spacing[2],
    minWidth: 150,
  },
  copy: {
    gap: flameeTheme.spacing[1],
  },
});
