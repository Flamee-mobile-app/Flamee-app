import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ImageTile } from '@/components/ui';
import { flameeTheme } from '@/constants/flameeTheme';
import type { Mission } from '@/features/missions/types';

export type MissionRowProps = {
  mission: Mission;
  featured?: boolean;
  onComplete: () => void;
};

export function MissionRow({ mission, featured = false, onComplete }: MissionRowProps) {
  return (
    <Card style={featured ? styles.featured : styles.card}>
      {featured ? <ImageTile label={mission.imageLabel} height={130} /> : null}
      <View style={styles.copy}>
        <AppText variant={featured ? 'sectionTitle' : 'body'}>{mission.title}</AppText>
        {mission.description ? (
          <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary}>
            {mission.description}
          </AppText>
        ) : null}
        <AppText variant="caption" color={flameeTheme.colors.brand}>
          +{mission.xp} XP
        </AppText>
      </View>
      <Button
        title={mission.completed ? 'Đã hoàn thành' : 'Hoàn thành'}
        variant={mission.completed ? 'ghost' : 'secondary'}
        disabled={mission.completed}
        onPress={onComplete}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: flameeTheme.spacing[3],
  },
  featured: {
    gap: flameeTheme.spacing[4],
  },
  copy: {
    gap: flameeTheme.spacing[1],
  },
});
