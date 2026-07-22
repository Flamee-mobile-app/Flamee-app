import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppText, Card, ImageTile } from '@/shared/components/ui';
import { flameeFonts, flameeTheme } from '@/shared/constants/flameeTheme';
import type { DateIdea } from '@/features/dates/types';

export type DateIdeaCardProps = {
  idea: DateIdea;
  featured?: boolean;
  onPress?: (idea: DateIdea) => void;
};

export function DateIdeaCard({ idea, featured = false, onPress }: DateIdeaCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={() => onPress?.(idea)}
    >
      <Card style={featured ? styles.featured : styles.card}>
        <ImageTile label={idea.imageLabel} height={featured ? 150 : 86} />
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            {idea.emoji ? <AppText style={styles.emoji}>{idea.emoji}</AppText> : null}
            <AppText variant={featured ? 'sectionTitle' : 'body'} style={styles.titleText}>
              {idea.title}
            </AppText>
          </View>
          <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary}>
            📍 {idea.location}
          </AppText>
          <AppText variant="caption" color={flameeTheme.colors.brand}>
            ⏰ {idea.time}
          </AppText>
        </View>
        {onPress && !featured && (
          <View style={styles.addBadge}>
            <Ionicons name="add-circle" size={24} color="#FF7158" />
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  featured: {
    gap: flameeTheme.spacing[3],
  },
  card: {
    flexDirection: 'row',
    gap: flameeTheme.spacing[3],
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  copy: {
    flex: 1,
    gap: flameeTheme.spacing[1],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  titleText: {
    fontFamily: flameeFonts.bold,
  },
  addBadge: {
    paddingRight: 8,
  },
});

