import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { AppImage } from '@/shared/components/media';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { timelineAssets } from '@/features/timeline/timelineAssets';
import type { RelationshipSummary } from '@/features/timeline/types';

export type TimelineHeroProps = {
  summary: RelationshipSummary;
  compact?: boolean;
};

export function TimelineHero({
  summary,
  compact = false,
}: TimelineHeroProps) {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <AppImage
        contentFit="cover"
        contentPosition="right center"
        source={timelineAssets.hero}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          'rgba(255, 104, 83, 0.98)',
          'rgba(255, 112, 82, 0.64)',
          'rgba(50, 15, 8, 0.18)',
        ]}
        end={{ x: 1, y: 0.45 }}
        start={{ x: 0, y: 0.45 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, compact && styles.compactContent]}>
        <View>
          <AppText
            color={flameeTheme.colors.text.inverse}
            style={[styles.days, compact && styles.compactDays]}>
            {summary.daysTogether}
          </AppText>
          <AppText
            color={flameeTheme.colors.text.inverse}
            style={styles.subtitle}
            variant="body">
            Ngày bên nhau
          </AppText>
        </View>

        <View style={styles.countdown}>
          <CountdownUnit label="Ngày" value={summary.countdownDays} />
          <CountdownUnit label="Giờ" value={summary.countdownHours} />
        </View>
      </View>
    </View>
  );
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.unit}>
      <View style={styles.valueSurface}>
        <AppText
          align="center"
          color={flameeTheme.colors.text.inverse}
          style={styles.value}
          variant="title">
          {String(value).padStart(2, '0')}
        </AppText>
      </View>
      <AppText
        align="center"
        color={flameeTheme.colors.text.inverse}
        variant="bodySmall">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    aspectRatio: 1.62,
  },
  compactContent: {
    padding: flameeTheme.spacing[4],
  },
  compactDays: {
    fontSize: 32,
    lineHeight: 35,
  },
  container: {
    aspectRatio: 354 / 201,
    borderRadius: flameeTheme.radii.xxl,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: flameeTheme.spacing[6],
  },
  countdown: {
    flexDirection: 'row',
    gap: flameeTheme.spacing[4],
  },
  days: {
    fontFamily: flameeTheme.fonts.roundedBold,
    fontSize: 36,
    lineHeight: 39,
  },
  subtitle: {
    fontWeight: '600',
  },
  unit: {
    gap: flameeTheme.spacing[1],
  },
  value: {
    fontWeight: '700',
  },
  valueSurface: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: flameeTheme.radii.sm,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
