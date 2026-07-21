import { StyleSheet, View } from 'react-native';

import { AppText, Card, ImageTile, StatCard } from '@/shared/components/ui';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import type { ProfileData } from '@/features/profile/types';

export type ProfileSummaryProps = {
  profile: ProfileData;
};

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  return (
    <Card style={styles.card}>
      <ImageTile label={`${profile.displayName} + ${profile.partnerName}`} height={160} />
      <View style={styles.copy}>
        <AppText variant="title" align="center">
          {profile.displayName} & {profile.partnerName}
        </AppText>
        <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary} align="center">
          {profile.relationshipLabel}
        </AppText>
      </View>
      <View style={styles.stats}>
        {profile.stats.map((stat) => (
          <StatCard key={stat.label} value={stat.value} label={stat.label} />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: flameeTheme.spacing[4],
  },
  copy: {
    gap: flameeTheme.spacing[1],
  },
  stats: {
    flexDirection: 'row',
    gap: flameeTheme.spacing[3],
  },
});
