import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

import { AppText } from './AppText';

export type PillTabItem = {
  label: string;
  value: string;
};

export type PillTabsProps = {
  items: PillTabItem[];
  value: string;
  onChange: (value: string) => void;
};

export function PillTabs({ items, value, onChange }: PillTabsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[styles.pill, selected && styles.selectedPill]}>
            <AppText
              variant="bodySmall"
              color={selected ? flameeTheme.colors.text.inverse : flameeTheme.colors.brand}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: flameeTheme.spacing[2],
  },
  pill: {
    alignItems: 'center',
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.full,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: flameeTheme.spacing[4],
  },
  selectedPill: {
    backgroundColor: flameeTheme.colors.brand,
  },
});
