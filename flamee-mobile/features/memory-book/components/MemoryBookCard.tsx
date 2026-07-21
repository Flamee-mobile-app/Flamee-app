import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { AppImage } from '@/shared/components/media';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { memoryBookAssets } from '@/features/memory-book/memoryBookAssets';
import type { MemoryBookEntry } from '@/features/memory-book/types';

const covers = memoryBookAssets;

export function MemoryBookCard({ entry, onPress }: { entry: MemoryBookEntry; onPress: () => void }) {
  return <Pressable accessibilityLabel={`Mở ${entry.title}`} accessibilityRole="button" onPress={onPress} style={styles.card}>
    <AppImage contentFit="cover" source={covers[entry.coverAssetKey]} style={styles.cover} />
    <View style={styles.copy}><AppText style={styles.date} variant="caption">{entry.occurredOn.split('-').reverse().join('.')}</AppText><AppText style={styles.title} variant="subtitle">{entry.title}</AppText><AppText color={flameeTheme.colors.text.secondary} numberOfLines={2} variant="bodySmall">{entry.note}</AppText></View>
  </Pressable>;
}

export const memoryBookCover = covers;
const styles = StyleSheet.create({ card: { backgroundColor: '#FFFFFF', borderRadius: 22, elevation: 2, overflow: 'hidden', shadowColor: '#7A4D44', shadowOpacity: .12, shadowRadius: 12 }, cover: { height: 154, width: '100%' }, copy: { gap: 6, padding: 16 }, date: { color: flameeTheme.colors.brand, fontWeight: '700' }, title: { fontWeight: '700' } });
