import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MemoryBookCard } from '@/features/memory-book/components/MemoryBookCard';
import { useMemoryBook } from '@/features/memory-book/hooks/useMemoryBook';
import { AppText } from '@/shared/components/ui/AppText';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { useAppSafeArea } from '@/shared/hooks';

import { CreateMemoryBookScreen } from './CreateMemoryBookScreen';
import { EditMemoryBookScreen } from './EditMemoryBookScreen';
import { MemoryBookDetailScreen } from './MemoryBookDetailScreen';

export function MemoryBookScreen() {
  const book = useMemoryBook();
  const safeArea = useAppSafeArea();

  if (book.view === 'create') {
    return (
      <CreateMemoryBookScreen
        draft={book.draft}
        errors={book.errors}
        onChange={book.updateDraft}
        onClose={book.close}
        onSave={book.saveCreate}
      />
    );
  }

  if (book.view === 'edit') {
    return (
      <EditMemoryBookScreen
        draft={book.draft}
        errors={book.errors}
        onChange={book.updateDraft}
        onClose={book.close}
        onSave={book.saveEdit}
      />
    );
  }

  if (book.view === 'detail' && book.selectedEntry) {
    return (
      <MemoryBookDetailScreen
        entry={book.selectedEntry}
        onBack={book.close}
        onDelete={book.deleteSelected}
        onEdit={() => book.openEdit(book.selectedEntry!.id)}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { paddingTop: safeArea.top + 16, paddingBottom: safeArea.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <AppText style={styles.title} variant="heading">
            Sổ kỉ niệm
          </AppText>
          <AppText color={flameeTheme.colors.text.secondary} variant="bodySmall">
            Những trang mình đã cùng viết
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="Thêm kỉ niệm"
          accessibilityRole="button"
          onPress={book.openCreate}
          style={styles.add}>
          <Ionicons color="#FFFFFF" name="add" size={26} />
        </Pressable>
      </View>
      {book.entries.length ? (
        <View style={styles.grid}>
          {book.entries.map((entry) => (
            <MemoryBookCard
              entry={entry}
              key={entry.id}
              onPress={() => book.openDetail(entry.id)}
            />
          ))}
        </View>
      ) : (
        <AppText align="center" color={flameeTheme.colors.text.secondary} variant="body">
          Hãy lưu lại trang kỉ niệm đầu tiên của hai bạn.
        </AppText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFDFB',
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 30,
  },
  add: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.brand,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  grid: {
    gap: 18,
  },
});
