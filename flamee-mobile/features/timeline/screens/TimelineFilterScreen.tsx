import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/ui/AppText';
import { flameeTheme } from '@/shared/constants/flameeTheme';
import { useAppSafeArea } from '@/shared/hooks';
import { TimelineChip } from '@/features/timeline/components/TimelineChip';
import {
  TIMELINE_RANGE_LABELS,
  TIMELINE_STATUS_LABELS,
  TIMELINE_TYPE_LABELS,
  TIMELINE_TYPE_OPTIONS,
} from '@/features/timeline/timelineConstants';
import {
  getTimelineContentWidth,
  TIMELINE_LAYOUT,
} from '@/features/timeline/timelineLayout';
import type {
  TimelineFilter,
  TimelineRangeFilter,
  TimelineStatusFilter,
  TimelineTypeFilter,
} from '@/features/timeline/types';

const STATUS_OPTIONS: readonly TimelineStatusFilter[] = [
  'all',
  'upcoming',
  'past',
];
const RANGE_OPTIONS: readonly TimelineRangeFilter[] = ['all', 'next30', 'past'];
const TYPE_OPTIONS: readonly TimelineTypeFilter[] = [
  'all',
  ...TIMELINE_TYPE_OPTIONS.map((option) => option.value),
];

export type TimelineFilterScreenProps = {
  filter: TimelineFilter;
  onChange: (patch: Partial<TimelineFilter>) => void;
  onApply: () => void;
  onClose: () => void;
  onClear: () => void;
};

export function TimelineFilterScreen({
  filter,
  onChange,
  onApply,
  onClose,
  onClear,
}: TimelineFilterScreenProps) {
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  const safeArea = useAppSafeArea();
  const contentWidth = getTimelineContentWidth(width);

  const chooseType = (type: TimelineTypeFilter) => {
    onChange({ type });
    setTypeMenuOpen(false);
  };

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, { width: contentWidth, paddingTop: safeArea.top }]}>
        <Pressable
          accessibilityLabel="Đóng bộ lọc"
          accessibilityRole="button"
          hitSlop={6}
          onPress={onClose}
          style={styles.headerSide}>
          <AppText
            color={flameeTheme.colors.brand}
            style={styles.closeGlyph}>
            ‹
          </AppText>
        </Pressable>
        <AppText
          align="center"
          color={flameeTheme.colors.brand}
          style={styles.heading}
          variant="heading">
          Bộ lọc
        </AppText>
        <Pressable
          accessibilityLabel="Đặt lại bộ lọc"
          accessibilityRole="button"
          hitSlop={6}
          onPress={onClear}
          style={styles.headerSide}>
          <AppText
            align="right"
            color={flameeTheme.colors.brand}
            variant="caption">
            Đặt lại
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { width: contentWidth }]}>
          <FilterSection label="Bộ lọc">
            <View style={styles.chips}>
              {STATUS_OPTIONS.map((status) => (
                <TimelineChip
                  key={status}
                  accessibilityLabel={`Trạng thái: ${TIMELINE_STATUS_LABELS[status]}`}
                  label={TIMELINE_STATUS_LABELS[status]}
                  onPress={() => onChange({ status })}
                  selected={filter.status === status}
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection label="Loại cột mốc">
            <Pressable
              accessibilityLabel={`Chọn loại cột mốc, hiện tại ${TIMELINE_TYPE_LABELS[filter.type]}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: typeMenuOpen }}
              onPress={() => setTypeMenuOpen((open) => !open)}
              style={styles.select}>
              <AppText
                color={flameeTheme.colors.text.secondary}
                style={styles.selectLabel}
                variant="bodySmall">
                {TIMELINE_TYPE_LABELS[filter.type]}
              </AppText>
              <AppText
                color={flameeTheme.colors.text.secondary}
                style={[
                  styles.chevron,
                  typeMenuOpen && styles.chevronExpanded,
                ]}>
                ⌄
              </AppText>
            </Pressable>
            {typeMenuOpen ? (
              <View style={styles.typeMenu}>
                {TYPE_OPTIONS.map((type) => (
                  <Pressable
                    key={type}
                    accessibilityLabel={`Loại cột mốc: ${TIMELINE_TYPE_LABELS[type]}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filter.type === type }}
                    onPress={() => chooseType(type)}
                    style={[
                      styles.typeOption,
                      filter.type === type && styles.selectedTypeOption,
                    ]}>
                    <AppText
                      color={
                        filter.type === type
                          ? flameeTheme.colors.brand
                          : flameeTheme.colors.text.secondary
                      }
                      style={styles.typeOptionLabel}
                      variant="bodySmall">
                      {TIMELINE_TYPE_LABELS[type]}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </FilterSection>

          <FilterSection label="Khoảng thời gian">
            <View style={styles.chips}>
              {RANGE_OPTIONS.map((range) => (
                <TimelineChip
                  key={range}
                  accessibilityLabel={`Khoảng thời gian: ${TIMELINE_RANGE_LABELS[range]}`}
                  label={TIMELINE_RANGE_LABELS[range]}
                  onPress={() => onChange({ range })}
                  selected={filter.range === range}
                />
              ))}
            </View>
          </FilterSection>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: safeArea.bottom + flameeTheme.spacing[2],
          },
        ]}>
        <Pressable
          accessibilityLabel="Áp dụng bộ lọc"
          accessibilityRole="button"
          onPress={onApply}
          style={[styles.applyButton, { width: contentWidth }]}>
          <LinearGradient
            colors={flameeTheme.gradients.brandH}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={styles.applyGradient}>
            <AppText
              align="center"
              color={flameeTheme.colors.text.inverse}
              variant="bodySmall">
              Áp dụng
            </AppText>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <AppText
        color={flameeTheme.colors.text.secondary}
        variant="bodyRegular">
        {label}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  applyButton: {
    borderRadius: flameeTheme.radii.full,
    maxWidth: 294,
    overflow: 'hidden',
  },
  applyGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TIMELINE_LAYOUT.actionMinHeight,
    paddingHorizontal: flameeTheme.spacing[6],
  },
  chevron: {
    fontSize: 22,
    lineHeight: 22,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: flameeTheme.spacing[4],
  },
  closeGlyph: {
    fontSize: 34,
    lineHeight: 36,
  },
  content: {
    gap: flameeTheme.spacing[10],
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: TIMELINE_LAYOUT.horizontalPadding,
    paddingTop: flameeTheme.spacing[4],
  },
  header: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    minHeight: 64,
  },
  headerSide: {
    justifyContent: 'center',
    minHeight: TIMELINE_LAYOUT.actionMinHeight,
    width: 72,
  },
  heading: {
    flex: 1,
    fontSize: 30,
    lineHeight: 36,
  },
  safeArea: {
    backgroundColor: '#FFFDFB',
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: flameeTheme.spacing[8],
    paddingTop: flameeTheme.spacing[4],
  },
  section: {
    gap: flameeTheme.spacing[3],
  },
  select: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: flameeTheme.colors.text.secondary,
    borderRadius: flameeTheme.radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: TIMELINE_LAYOUT.actionMinHeight,
    paddingHorizontal: flameeTheme.spacing[4],
  },
  selectLabel: {
    fontWeight: '500',
  },
  selectedTypeOption: {
    backgroundColor: flameeTheme.colors.brandLight,
  },
  typeMenu: {
    backgroundColor: '#FFFFFF',
    borderColor: flameeTheme.colors.softCream,
    borderRadius: flameeTheme.radii.lg,
    borderWidth: 1,
    elevation: 4,
    marginTop: flameeTheme.spacing[2],
    overflow: 'hidden',
    shadowColor: '#35231E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  typeOption: {
    justifyContent: 'center',
    minHeight: TIMELINE_LAYOUT.actionMinHeight,
    paddingHorizontal: flameeTheme.spacing[4],
  },
  typeOptionLabel: {
    fontWeight: '500',
  },
});
