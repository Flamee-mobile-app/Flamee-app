import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/ui/AppText';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import {
  getTimelineContentWidth,
  TIMELINE_LAYOUT,
} from '@/features/timeline/timelineLayout';
import type {
  TimelineItem,
  RelationshipSummary,
} from '@/features/timeline/types';

import { TimelineEmptyState } from './TimelineEmptyState';
import { TimelineHero } from './TimelineHero';
import { TimelineListCard } from './TimelineListCard';

export type TimelineOverviewProps = {
  summary: RelationshipSummary;
  timeline: TimelineItem[];
  referenceDate: Date;
  onOpenFilter: () => void;
  onAdd: () => void;
  onOpenTimeline: (timelineId: string) => void;
  onClearFilter: () => void;
};

export function TimelineOverview({
  summary,
  timeline,
  referenceDate,
  onOpenFilter,
  onAdd,
  onOpenTimeline,
  onClearFilter,
}: TimelineOverviewProps) {
  const { width } = useWindowDimensions();
  const contentWidth = getTimelineContentWidth(width);
  const floatingActionInset = Math.max(
    (width - contentWidth) / 2,
    TIMELINE_LAYOUT.horizontalPadding,
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

          <TimelineHero compact={contentWidth < 320} summary={summary} />

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

          {timeline.length > 0 ? (
            <View style={styles.list} testID="timeline-list">
              {timeline.map((timeline) => (
                <TimelineListCard
                  key={timeline.id}
                  timeline={timeline}
                  onPress={onOpenTimeline}
                  referenceDate={referenceDate}
                />
              ))}
            </View>
          ) : (
            <TimelineEmptyState onClearFilter={onClearFilter} />
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
              TIMELINE_LAYOUT.bottomNavClearance + flameeTheme.spacing[5],
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
    height: TIMELINE_LAYOUT.actionMinHeight,
    justifyContent: 'center',
    width: TIMELINE_LAYOUT.actionMinHeight,
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
    height: TIMELINE_LAYOUT.floatingActionSize,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: flameeTheme.colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    width: TIMELINE_LAYOUT.floatingActionSize,
  },
  heading: {
    fontSize: 30,
    lineHeight: 36,
  },
  list: {
    gap: TIMELINE_LAYOUT.gridGap,
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
      TIMELINE_LAYOUT.bottomNavClearance + TIMELINE_LAYOUT.floatingActionSize,
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
