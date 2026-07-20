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

import { AppText } from '@/components/ui/AppText';
import { flameeTheme } from '@/constants/flameeTheme';
import { MemoryChip } from '@/features/memories/components/MemoryChip';
import {
  MEMORY_RANGE_LABELS,
  MEMORY_STATUS_LABELS,
  MEMORY_TYPE_LABELS,
  MEMORY_TYPE_OPTIONS,
} from '@/features/memories/constants';
import {
  getMemoryContentWidth,
  MEMORY_LAYOUT,
} from '@/features/memories/memoryLayout';
import type {
  MemoryFilter,
  MemoryRangeFilter,
  MemoryStatusFilter,
  MemoryTypeFilter,
} from '@/features/memories/types';

const STATUS_OPTIONS: readonly MemoryStatusFilter[] = [
  'all',
  'upcoming',
  'past',
];
const RANGE_OPTIONS: readonly MemoryRangeFilter[] = ['all', 'next30', 'past'];
const TYPE_OPTIONS: readonly MemoryTypeFilter[] = [
  'all',
  ...MEMORY_TYPE_OPTIONS.map((option) => option.value),
];

export type MemoryFilterScreenProps = {
  filter: MemoryFilter;
  onChange: (patch: Partial<MemoryFilter>) => void;
  onApply: () => void;
  onClose: () => void;
  onClear: () => void;
};

export function MemoryFilterScreen({
  filter,
  onChange,
  onApply,
  onClose,
  onClear,
}: MemoryFilterScreenProps) {
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = getMemoryContentWidth(width);

  const chooseType = (type: MemoryTypeFilter) => {
    onChange({ type });
    setTypeMenuOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { width: contentWidth }]}>
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
                <MemoryChip
                  key={status}
                  accessibilityLabel={`Trạng thái: ${MEMORY_STATUS_LABELS[status]}`}
                  label={MEMORY_STATUS_LABELS[status]}
                  onPress={() => onChange({ status })}
                  selected={filter.status === status}
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection label="Loại cột mốc">
            <Pressable
              accessibilityLabel={`Chọn loại cột mốc, hiện tại ${MEMORY_TYPE_LABELS[filter.type]}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: typeMenuOpen }}
              onPress={() => setTypeMenuOpen((open) => !open)}
              style={styles.select}>
              <AppText
                color={flameeTheme.colors.text.secondary}
                style={styles.selectLabel}
                variant="bodySmall">
                {MEMORY_TYPE_LABELS[filter.type]}
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
                    accessibilityLabel={`Loại cột mốc: ${MEMORY_TYPE_LABELS[type]}`}
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
                      {MEMORY_TYPE_LABELS[type]}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </FilterSection>

          <FilterSection label="Khoảng thời gian">
            <View style={styles.chips}>
              {RANGE_OPTIONS.map((range) => (
                <MemoryChip
                  key={range}
                  accessibilityLabel={`Khoảng thời gian: ${MEMORY_RANGE_LABELS[range]}`}
                  label={MEMORY_RANGE_LABELS[range]}
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
            paddingBottom: Math.max(
              insets.bottom + flameeTheme.spacing[4],
              flameeTheme.spacing[6],
            ),
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
    </SafeAreaView>
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
    minHeight: MEMORY_LAYOUT.actionMinHeight,
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
    paddingHorizontal: MEMORY_LAYOUT.horizontalPadding,
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
    minHeight: MEMORY_LAYOUT.actionMinHeight,
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
    minHeight: MEMORY_LAYOUT.actionMinHeight,
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
    minHeight: MEMORY_LAYOUT.actionMinHeight,
    paddingHorizontal: flameeTheme.spacing[4],
  },
  typeOptionLabel: {
    fontWeight: '500',
  },
});
