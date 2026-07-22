import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import type { MissionCategory } from '@/features/missions/types';

interface MissionCategoryTabsProps {
  selectedCategory: MissionCategory;
  onSelectCategory: (cat: MissionCategory) => void;
}

const CATEGORY_TABS: { label: string; value: MissionCategory }[] = [
  { label: 'Hằng ngày', value: 'daily' },
  { label: 'Hằng tuần', value: 'weekly' },
  { label: 'Hàng tháng', value: 'monthly' },
];

export function MissionCategoryTabs({
  selectedCategory,
  onSelectCategory,
}: MissionCategoryTabsProps) {
  const handlePress = (cat: MissionCategory) => {
    Haptics.selectionAsync();
    onSelectCategory(cat);
  };

  return (
    <View style={styles.container}>
      {CATEGORY_TABS.map((tab) => {
        const active = selectedCategory === tab.value;
        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => handlePress(tab.value)}
            style={[styles.tabButton, active && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            {active ? (
              <LinearGradient
                colors={['#FCB76D', '#FF7158']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  tabButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FCB76D',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  tabButtonActive: {
    borderColor: 'transparent',
  },
  tabText: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#FF7158',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
