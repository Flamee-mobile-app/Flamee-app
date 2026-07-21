import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import {
  formatTimelineDate,
  getDaysUntil,
} from '@/features/timeline/services/timelineService';
import type { TimelineItem } from '@/features/timeline/types';

export type TimelineListCardProps = {
  timeline: TimelineItem;
  referenceDate: Date;
  onPress: (timelineId: string) => void;
};

function formatCountdown(daysUntil: number) {
  if (daysUntil === 0) {
    return 'Hôm nay';
  }
  if (daysUntil < 0) {
    return `Đã qua ${Math.abs(daysUntil)} ngày`;
  }
  return `Còn ${daysUntil} ngày`;
}

export function TimelineListCard({
  timeline,
  referenceDate,
  onPress,
}: TimelineListCardProps) {
  const daysUntil = getDaysUntil(timeline.eventDate, referenceDate);
  return (
    <Pressable
      accessibilityLabel={`Mở ${timeline.title}`}
      accessibilityRole="button"
      onPress={() => onPress(timeline.id)}
      style={styles.card}
      testID="timeline-list-card">
      <View style={styles.iconSurface} testID="timeline-category-icon">
        <Ionicons color={getIconColor(timeline.type)} name={getIconName(timeline.type)} size={28} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title} variant="body">
          {timeline.title}
        </AppText>
        <AppText color={flameeTheme.colors.brand} style={styles.countdown} variant="caption">
          {formatCountdown(daysUntil)}
        </AppText>
      </View>
      <AppText color={flameeTheme.colors.text.secondary} style={styles.date} variant="caption">
        {formatTimelineDate(timeline.eventDate)}
      </AppText>
    </Pressable>
  );
}

function getIconName(type: TimelineItem['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'together': return 'heart';
    case 'birthday': return 'gift';
    case 'holiday': return 'umbrella';
    case 'special': return 'film';
    case 'anniversary': return 'star';
    default: return 'sparkles';
  }
}

function getIconColor(type: TimelineItem['type']) {
  return type === 'together' ? '#FF7158' : type === 'holiday' ? '#E2C13C' : flameeTheme.colors.brand;
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF1E4',
    borderRadius: flameeTheme.radii.xl,
    elevation: 2,
    flexDirection: 'row',
    gap: flameeTheme.spacing[3],
    minHeight: 80,
    paddingHorizontal: flameeTheme.spacing[4],
    paddingVertical: flameeTheme.spacing[3],
    shadowColor: '#66352C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    width: '100%',
  },
  copy: { flex: 1, gap: flameeTheme.spacing[1] },
  countdown: { fontWeight: '600' },
  date: { marginLeft: flameeTheme.spacing[2] },
  iconSurface: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  title: {
    fontWeight: '700',
    lineHeight: 21,
  },
});
