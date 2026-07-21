import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/shared/constants/flameeTheme';

import { AppText } from './AppText';
import type { IconName } from './IconButton';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leadingIcon?: IconName;
  trailingText?: string;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, leadingIcon, trailingText, onPress }: ListRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.left}>
        {leadingIcon ? <Ionicons name={leadingIcon} size={20} color={flameeTheme.colors.brand} /> : null}
        <View style={styles.copy}>
          <AppText variant="body">{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" color={flameeTheme.colors.text.secondary}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        {trailingText ? (
          <AppText variant="caption" color={flameeTheme.colors.text.secondary}>
            {trailingText}
          </AppText>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={flameeTheme.colors.text.secondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: flameeTheme.colors.background,
    borderRadius: flameeTheme.radii.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: flameeTheme.spacing[4],
    paddingVertical: flameeTheme.spacing[3],
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: flameeTheme.spacing[3],
  },
  copy: {
    flex: 1,
  },
  right: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: flameeTheme.spacing[2],
  },
  pressed: {
    opacity: 0.82,
  },
});
