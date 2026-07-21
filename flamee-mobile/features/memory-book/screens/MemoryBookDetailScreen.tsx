import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { Button } from '@/shared/components/ui/Button';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { memoryBookCover } from '@/features/memory-book/components/MemoryBookCard';
import { useAppSafeArea } from '@/shared/hooks';
import type { MemoryBookEntry } from '@/features/memory-book/types';

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

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingTop: safeArea.top + 12, paddingBottom: safeArea.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Quay lại sổ kỉ niệm" onPress={onBack} hitSlop={8}>
          <Ionicons color={flameeTheme.colors.brand} name="arrow-back" size={24} />
        </Pressable>
        <AppText variant="title">Kỉ niệm</AppText>
        <Pressable accessibilityLabel="Chỉnh sửa kỉ niệm" onPress={onEdit} hitSlop={8}>
          <Ionicons color={flameeTheme.colors.brand} name="create-outline" size={24} />
        </Pressable>
      </View>
      <Image contentFit="cover" source={memoryBookCover[entry.coverAssetKey]} style={styles.image} />
      <AppText style={styles.date} variant="caption">
        {entry.occurredOn.split('-').reverse().join(' tháng ')}
      </AppText>
      <AppText style={styles.title} variant="heading">
        {entry.title}
      </AppText>
      <AppText color={flameeTheme.colors.text.secondary} variant="body">
        {entry.note || 'Chưa có ghi chú cho khoảnh khắc này.'}
      </AppText>
      {entry.location ? <AppText variant="bodySmall">📍 {entry.location}</AppText> : null}
      <View style={styles.actions}>
        <Button title="Chỉnh sửa" onPress={onEdit} />
        <Button title="Xóa kỉ niệm" onPress={onDelete} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFDFB',
    flexGrow: 1,
    gap: 18,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  image: {
    borderRadius: 24,
    height: 300,
    width: '100%',
  },
  date: {
    color: flameeTheme.colors.brand,
  },
  title: {
    fontSize: 30,
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
});
