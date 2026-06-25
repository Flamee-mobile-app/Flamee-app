import { StyleSheet, View } from 'react-native';

import { AppText, Card, ImageTile } from '@/components/ui';
import { flameeTheme } from '@/constants/flameeTheme';
import type { DateIdea } from '@/features/dates/types';

export type DateIdeaCardProps = {
  idea: DateIdea;
  featured?: boolean;
};

export function DateIdeaCard({ idea, featured = false }: DateIdeaCardProps) {
  return (
    <Card style={featured ? styles.featured : styles.card}>
      <ImageTile label={idea.imageLabel} height={featured ? 150 : 86} />
      <View style={styles.copy}>
        <AppText variant={featured ? 'sectionTitle' : 'body'}>{idea.title}</AppText>
        <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary}>
          {idea.location}
        </AppText>
        <AppText variant="caption" color={flameeTheme.colors.brand}>
          {idea.time}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  featured: {
    gap: flameeTheme.spacing[3],
  },
  card: {
    flexDirection: 'row',
    gap: flameeTheme.spacing[3],
  },
  copy: {
    flex: 1,
    gap: flameeTheme.spacing[1],
  },
});
