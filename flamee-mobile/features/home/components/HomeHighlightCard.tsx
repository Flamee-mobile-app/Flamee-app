import { StyleSheet, View } from 'react-native';

import { AppText, Card, ImageTile } from '@/components/ui';
import { flameeTheme } from '@/constants/flameeTheme';

import type { HomeHighlight } from '@/features/home/types';

export type HomeHighlightCardProps = {
  highlight: HomeHighlight;
  onPress: () => void;
};

export function HomeHighlightCard({ highlight, onPress }: HomeHighlightCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <ImageTile label={highlight.imageLabel} height={82} />
      <View style={styles.copy}>
        <AppText variant="sectionTitle">{highlight.title}</AppText>
        <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary}>
          {highlight.description}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: flameeTheme.spacing[3],
    width: '100%',
  },
  copy: {
    gap: flameeTheme.spacing[1],
  },
});
