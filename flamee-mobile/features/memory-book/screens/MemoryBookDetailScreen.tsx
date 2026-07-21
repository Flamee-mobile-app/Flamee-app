import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getMemoryBookCover } from '@/features/memory-book/memoryBookAssets';
import type { MemoryBookEntry } from '@/features/memory-book/types';
import { AppImage } from '@/shared/components/media';
import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { useAppSafeArea } from '@/shared/hooks';

const DEFAULT_TAGS = ['Kỷ niệm', 'Yêu thương', 'Hạnh phúc'];

const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  'Kỷ niệm': { bg: '#FEEFEA', text: '#FF7E67' },
  'Kỉ niệm': { bg: '#FEEFEA', text: '#FF7E67' },
  'Yêu thương': { bg: '#ECE6F8', text: '#7C5CFC' },
  'Hạnh phúc': { bg: '#FFF6E5', text: '#F5A623' },
  'Chuyến đi': { bg: '#E6F4FE', text: '#2B8CFF' },
  'Biển': { bg: '#E6F4FE', text: '#2B8CFF' },
  'Đặc biệt': { bg: '#FEEFEA', text: '#FF7E67' },
};

export function MemoryBookDetailScreen({
  entry,
  onBack,
  onEdit,
  onDelete,
}: {
  entry: MemoryBookEntry;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const safeArea = useAppSafeArea();
  const tags = entry.tags && entry.tags.length > 0 ? entry.tags : DEFAULT_TAGS;
  const photos =
    entry.photos && entry.photos.length > 0
      ? entry.photos
      : ['hero', 'together', 'trip', 'special'];

  const formattedDate = entry.occurredOn.split('-').reverse().join('/');
  const locationText = entry.location || 'Thành phố Hồ Chí Minh';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingTop: safeArea.top + 12, paddingBottom: safeArea.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable accessibilityLabel="Quay lại" hitSlop={12} onPress={onBack}>
          <Ionicons color="#FF7E67" name="arrow-back" size={24} />
        </Pressable>
        <AppText style={styles.headerTitle}>Chi tiết kỷ niệm</AppText>
        <Pressable accessibilityLabel="Chỉnh sửa kỉ niệm" hitSlop={12} onPress={onEdit}>
          <Ionicons color="#FF7E67" name="options-outline" size={24} />
        </Pressable>
      </View>

      {/* Hero Banner Image */}
      <View style={styles.heroContainer}>
        <AppImage
          contentFit="cover"
          source={getMemoryBookCover(entry.coverAssetKey)}
          style={styles.heroImage}
        />
      </View>

      {/* Title & Meta Info */}
      <View style={styles.infoSection}>
        <AppText style={styles.entryTitle}>{entry.title}</AppText>
        <View style={styles.metaRow}>
          <Ionicons color="#7D7D7D" name="time-outline" size={16} />
          <AppText style={styles.metaText}>{formattedDate}</AppText>
          <AppText style={styles.metaDot}>•</AppText>
          <AppText style={styles.metaText}>{locationText}</AppText>
        </View>

        {/* Note / Description */}
        <AppText style={styles.noteText}>
          {entry.note ||
            '500 ngày không quá dài, nhưng đủ để chúng mình hiểu, thương và đồng hành cùng nhau mỗi ngày.'}
        </AppText>

        {/* Emotion Tag Pills */}
        <View style={styles.tagsRow}>
          {tags.map((tag) => {
            const style = TAG_STYLES[tag] || { bg: '#FEEFEA', text: '#FF7E67' };
            return (
              <View
                key={tag}
                style={[styles.tagPill, { backgroundColor: style.bg }]}>
                <AppText style={[styles.tagText, { color: style.text }]}>
                  {tag}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>

      {/* Photo Gallery Section */}
      <View style={styles.gallerySection}>
        <AppText style={styles.galleryTitle}>Ảnh trong kỷ niệm</AppText>
        <ScrollView
          horizontal
          contentContainerStyle={styles.galleryRow}
          showsHorizontalScrollIndicator={false}>
          {photos.slice(0, 3).map((photoKey, idx) => (
            <View key={idx} style={styles.thumbContainer}>
              <AppImage
                contentFit="cover"
                source={getMemoryBookCover(photoKey)}
                style={styles.thumbImage}
              />
            </View>
          ))}
          {/* Overlay thumbnail for remaining photos count */}
          <View style={styles.thumbContainer}>
            <AppImage
              contentFit="cover"
              source={getMemoryBookCover(photos[3] || 'together')}
              style={styles.thumbImage}
            />
            <View style={styles.thumbOverlay}>
              <AppText style={styles.overlayText}>+12</AppText>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Chỉnh sửa kỷ niệm" onPress={onEdit} />
        <Button title="Xóa kỷ niệm này" onPress={onDelete} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFDFB',
    flexGrow: 1,
    gap: 20,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FF7E67',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroContainer: {
    borderRadius: 28,
    height: 240,
    overflow: 'hidden',
    shadowColor: '#5C3026',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  infoSection: {
    gap: 12,
  },
  entryTitle: {
    color: '#FF7E67',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  metaText: {
    color: '#7D7D7D',
    fontSize: 14,
    fontWeight: '500',
  },
  metaDot: {
    color: '#7D7D7D',
    fontSize: 14,
  },
  noteText: {
    color: '#2B2B2B',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  tagPill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gallerySection: {
    gap: 12,
    marginTop: 4,
  },
  galleryTitle: {
    color: '#2B2B2B',
    fontSize: 17,
    fontWeight: '700',
  },
  galleryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  thumbContainer: {
    borderRadius: 18,
    height: 76,
    overflow: 'hidden',
    position: 'relative',
    width: 76,
  },
  thumbImage: {
    height: '100%',
    width: '100%',
  },
  thumbOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    justifyContent: 'center',
    ...StyleSheet.absoluteFillObject,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
});

