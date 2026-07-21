import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { getMemoryBookCover, memoryBookAssets } from '@/features/memory-book/memoryBookAssets';
import type { MemoryBookEntry } from '@/features/memory-book/types';
import { AppImage } from '@/shared/components/media';
import { AppText } from '@/shared/components/ui/AppText';

export const memoryBookCover = memoryBookAssets;

export function MemoryBookCard({
  entry,
  onPress,
}: {
  entry: MemoryBookEntry;
  onPress: () => void;
}) {
  const categoryLabel = entry.category || 'Đặc biệt';
  const formattedDate = entry.occurredOn.split('-').reverse().join('/');

  return (
    <Pressable
      accessibilityLabel={`Mở ${entry.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}>
      <AppImage
        contentFit="cover"
        source={getMemoryBookCover(entry.coverAssetKey)}
        style={styles.coverImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
        locations={[0.3, 0.65, 1]}
        style={styles.gradientOverlay}
      />
      <View style={styles.cardContent}>
        <View style={styles.badgeContainer}>
          <AppText style={styles.badgeText}>{categoryLabel}</AppText>
        </View>
        <AppText numberOfLines={1} style={styles.titleText}>
          {entry.title}
        </AppText>
        <AppText style={styles.dateText}>{formattedDate}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    height: 205,
    overflow: 'hidden',
    shadowColor: '#5C3026',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  coverImage: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    gap: 4,
    justifyContent: 'flex-end',
    padding: 14,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 12,
    marginBottom: 2,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
});

