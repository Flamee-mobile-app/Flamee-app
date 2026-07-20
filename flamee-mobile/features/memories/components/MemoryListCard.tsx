import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { flameeTheme } from '@/constants/flameeTheme';
import { getMemoryArtwork } from '@/features/memories/constants';
import {
  formatMemoryDate,
  getDaysUntil,
} from '@/features/memories/services/memoryService';
import type { MemoryItem } from '@/features/memories/types';

export type MemoryListCardProps = {
  memory: MemoryItem;
  referenceDate: Date;
  onPress: (memoryId: string) => void;
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

export function MemoryListCard({
  memory,
  referenceDate,
  onPress,
}: MemoryListCardProps) {
  const daysUntil = getDaysUntil(memory.eventDate, referenceDate);

  return (
    <Pressable
      accessibilityLabel={`Mở ${memory.title}`}
      accessibilityRole="button"
      onPress={() => onPress(memory.id)}
      style={styles.card}>
      <View style={styles.artwork}>
        <Image
          contentFit="contain"
          source={getMemoryArtwork(memory.coverAssetKey, memory.type)}
          style={styles.image}
        />
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={2} style={styles.title} variant="body">
          {memory.title}
        </AppText>
        <AppText color={flameeTheme.colors.brand} variant="caption">
          {formatCountdown(daysUntil)}
        </AppText>
      </View>
      <AppText
        color={flameeTheme.colors.text.secondary}
        style={styles.date}
        variant="caption">
        {formatMemoryDate(memory.eventDate)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artwork: {
    alignItems: 'center',
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  card: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.brandLight,
    borderRadius: flameeTheme.radii.lg,
    elevation: 3,
    flexDirection: 'row',
    gap: flameeTheme.spacing[2],
    minHeight: 72,
    paddingHorizontal: flameeTheme.spacing[3],
    paddingVertical: flameeTheme.spacing[2],
    shadowColor: '#35231E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  copy: {
    flex: 1,
    gap: flameeTheme.spacing[1],
    minWidth: 0,
  },
  date: {
    flexShrink: 0,
    marginTop: flameeTheme.spacing[6],
  },
  image: {
    height: 40,
    width: 40,
  },
  title: {
    fontWeight: '700',
    lineHeight: 19,
  },
});
