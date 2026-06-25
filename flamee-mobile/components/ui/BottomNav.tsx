import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

import { AppText } from './AppText';
import type { IconName } from './IconButton';

export type BottomNavItem = {
  label: string;
  icon: string;
  href: Href;
};

export type BottomNavProps = {
  items: BottomNavItem[];
  activeHref: Href;
  onNavigate: (href: Href) => void;
};

export function BottomNav({ items, activeHref, onNavigate }: BottomNavProps) {
  return (
    <View style={styles.nav}>
      {items.map((item) => {
        const selected = item.href === activeHref;
        return (
          <Pressable key={String(item.href)} onPress={() => onNavigate(item.href)} style={styles.item}>
            <Ionicons
              name={item.icon as IconName}
              size={22}
              color={selected ? flameeTheme.colors.brand : flameeTheme.colors.text.secondary}
            />
            <AppText
              variant="micro"
              color={selected ? flameeTheme.colors.brand : flameeTheme.colors.text.secondary}
              align="center">
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.background,
    borderColor: flameeTheme.colors.softCream,
    borderRadius: flameeTheme.radii.xxl,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: flameeTheme.spacing[4],
    paddingVertical: flameeTheme.spacing[2],
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
});
