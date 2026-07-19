import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';
import { MAIN_NAV_ITEMS } from '@/lib/navigation/routes';

import { AppText } from './AppText';
import type { IconName } from './IconButton';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <View style={styles.nav}>
        {MAIN_NAV_ITEMS.map((item) => {
          const selected = String(item.href).replace('/(main)', '') === pathname;

          return (
            <Pressable
              key={item.key}
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => router.replace(item.href)}
              style={styles.item}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    paddingBottom: flameeTheme.spacing[5],
    paddingHorizontal: flameeTheme.spacing[2],
    position: 'absolute',
    right: 0,
  },
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
