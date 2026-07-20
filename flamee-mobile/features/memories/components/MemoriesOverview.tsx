import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { flameeTheme } from '@/constants/flameeTheme';
import {
  getMemoryContentWidth,
  MEMORY_LAYOUT,
} from '@/features/memories/memoryLayout';
import type {
  MemoryItem,
  RelationshipSummary,
} from '@/features/memories/types';

import { MemoryEmptyState } from './MemoryEmptyState';
import { MemoryHero } from './MemoryHero';
import { MemoryListCard } from './MemoryListCard';

export type MemoriesOverviewProps = {
  summary: RelationshipSummary;
  memories: MemoryItem[];
  referenceDate: Date;
  onOpenFilter: () => void;
  onAdd: () => void;
  onOpenMemory: (memoryId: string) => void;
  onClearFilter: () => void;
};

export function MemoriesOverview({
  summary,
  memories,
  referenceDate,
  onOpenFilter,
  onAdd,
  onOpenMemory,
  onClearFilter,
}: MemoriesOverviewProps) {
  const { width } = useWindowDimensions();
  const contentWidth = getMemoryContentWidth(width);
  const floatingActionInset = Math.max(
    (width - contentWidth) / 2,
    MEMORY_LAYOUT.horizontalPadding,
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { width: contentWidth }]}>
          <AppText
            color={flameeTheme.colors.brand}
            style={styles.heading}
            variant="heading">
            Dòng thời gian
          </AppText>

          <MemoryHero compact={contentWidth < 320} summary={summary} />

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} variant="title">
              Các cột mốc sắp đến
            </AppText>
            <Pressable
              accessibilityLabel="Lọc cột mốc"
              accessibilityRole="button"
              hitSlop={6}
              onPress={onOpenFilter}
              style={styles.filterButton}>
              <FilterGlyph />
            </Pressable>
          </View>

          {memories.length > 0 ? (
            <View style={styles.list}>
              {memories.map((memory) => (
                <MemoryListCard
                  key={memory.id}
                  memory={memory}
                  onPress={onOpenMemory}
                  referenceDate={referenceDate}
                />
              ))}
            </View>
          ) : (
            <MemoryEmptyState onClearFilter={onClearFilter} />
          )}
        </View>
      </ScrollView>

      <Pressable
        accessibilityLabel="Thêm cột mốc"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onAdd}
        style={[
          styles.floatingAction,
          {
            bottom:
              MEMORY_LAYOUT.bottomNavClearance + flameeTheme.spacing[5],
            right: floatingActionInset,
          },
        ]}>
        <AppText
          align="center"
          color={flameeTheme.colors.text.inverse}
          style={styles.plus}>
          +
        </AppText>
      </Pressable>
    </SafeAreaView>
  );
}

function FilterGlyph() {
  return (
    <View accessible={false} style={styles.filterGlyph}>
      <View style={[styles.filterLine, styles.filterLineTop]}>
        <View style={styles.filterDot} />
      </View>
      <View style={[styles.filterLine, styles.filterLineMiddle]}>
        <View style={styles.filterDot} />
      </View>
      <View style={[styles.filterLine, styles.filterLineBottom]}>
        <View style={styles.filterDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: flameeTheme.spacing[6],
  },
  filterButton: {
    alignItems: 'center',
    borderRadius: flameeTheme.radii.full,
    height: MEMORY_LAYOUT.actionMinHeight,
    justifyContent: 'center',
    width: MEMORY_LAYOUT.actionMinHeight,
  },
  filterDot: {
    backgroundColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.full,
    height: 5,
    position: 'absolute',
    top: -2,
    width: 5,
  },
  filterGlyph: {
    height: 20,
    justifyContent: 'space-between',
    width: 22,
  },
  filterLine: {
    backgroundColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.full,
    height: 2,
    position: 'relative',
    width: 22,
  },
  filterLineBottom: {
    alignItems: 'flex-end',
  },
  filterLineMiddle: {
    alignItems: 'center',
  },
  filterLineTop: {
    alignItems: 'flex-start',
  },
  floatingAction: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.full,
    elevation: 6,
    height: MEMORY_LAYOUT.floatingActionSize,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: flameeTheme.colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    width: MEMORY_LAYOUT.floatingActionSize,
  },
  heading: {
    fontSize: 30,
    lineHeight: 36,
  },
  list: {
    gap: flameeTheme.spacing[4],
  },
  plus: {
    fontFamily: 'SF-Pro',
    fontSize: 38,
    fontWeight: '300',
    lineHeight: 42,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom:
      MEMORY_LAYOUT.bottomNavClearance + MEMORY_LAYOUT.floatingActionSize,
    paddingTop: flameeTheme.spacing[4],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -flameeTheme.spacing[3],
  },
  sectionTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
  },
});
