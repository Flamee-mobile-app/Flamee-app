import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MemoryBookCard } from '@/features/memory-book/components/MemoryBookCard';
import { useMemoryBook } from '@/features/memory-book/hooks/useMemoryBook';
import { AppText } from '@/shared/components/ui/AppText';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { useAppSafeArea } from '@/shared/hooks';

import { CreateMemoryBookScreen } from './CreateMemoryBookScreen';
import { EditMemoryBookScreen } from './EditMemoryBookScreen';
import { MemoryBookDetailScreen } from './MemoryBookDetailScreen';

const CATEGORIES = ['Tất cả', 'Chuyến đi', 'Đặc biệt', 'Yêu thích'] as const;

export function MemoryBookScreen() {
  const book = useMemoryBook();
  const safeArea = useAppSafeArea();
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');

  const filteredEntries = book.entries.filter((entry) => {
    if (activeCategory === 'Tất cả') return true;
    if (activeCategory === 'Yêu thích') {
      return (
        entry.category === 'Yêu thích' ||
        (entry.tags && entry.tags.includes('Yêu thích'))
      );
    }
    return entry.category === activeCategory;
  });

  return (
    <View style={styles.container}>
      {/* Main Overview List View */}
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { paddingTop: safeArea.top + 16, paddingBottom: safeArea.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.titleText}>Sổ kỷ niệm</AppText>
          <Pressable
            accessibilityLabel="Thêm kỉ niệm"
            accessibilityRole="button"
            onPress={book.openCreate}
            style={styles.addBtn}>
            <Ionicons color="#FFFFFF" name="add" size={24} />
          </Pressable>
        </View>

        {/* Filter Pills Bar */}
        <View style={styles.filterBarContainer}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.filterBar}
            showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}>
                  <AppText
                    color={isActive ? '#FFFFFF' : '#FF7E67'}
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}>
                    {cat}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2-Column Card Grid */}
        {filteredEntries.length ? (
          <View style={styles.grid}>
            {filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.gridColumn}>
                <MemoryBookCard
                  entry={entry}
                  onPress={() => book.openDetail(entry.id)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AppText align="center" color={flameeTheme.colors.text.secondary} variant="body">
              Chưa có kỷ niệm nào trong danh mục này.
            </AppText>
          </View>
        )}
      </ScrollView>

      {/* Sub-view Modals: Hides BottomNav for max screen area */}
      <Modal
        animationType="slide"
        onRequestClose={book.close}
        presentationStyle="fullScreen"
        testID="create-memory-book-modal"
        visible={book.view === 'create'}>
        <CreateMemoryBookScreen
          draft={book.draft}
          errors={book.errors}
          onChange={book.updateDraft}
          onClose={book.close}
          onSave={book.saveCreate}
        />
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={book.close}
        presentationStyle="fullScreen"
        testID="edit-memory-book-modal"
        visible={book.view === 'edit'}>
        <EditMemoryBookScreen
          draft={book.draft}
          errors={book.errors}
          onChange={book.updateDraft}
          onClose={book.close}
          onSave={book.saveEdit}
        />
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={book.close}
        presentationStyle="fullScreen"
        testID="detail-memory-book-modal"
        visible={book.view === 'detail' && !!book.selectedEntry}>
        {book.selectedEntry ? (
          <MemoryBookDetailScreen
            entry={book.selectedEntry}
            onBack={book.close}
            onDelete={book.deleteSelected}
            onEdit={() => book.openEdit(book.selectedEntry!.id)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFDFB',
    flex: 1,
  },
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
    marginTop: 4,
  },
  titleText: {
    color: '#FF7E67',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  addBtn: {
    alignItems: 'center',
    backgroundColor: '#FF7E67',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
    shadowColor: '#FF7E67',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  filterBarContainer: {
    height: 44,
  },
  filterBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  filterPill: {
    alignSelf: 'center',
    backgroundColor: '#FFFDFB',
    borderColor: '#FF9E8D',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  filterPillActive: {
    backgroundColor: '#FF7E67',
    borderColor: '#FF7E67',
  },
  filterPillText: {
    color: '#FF7E67',
    fontSize: 15,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: '48%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});



