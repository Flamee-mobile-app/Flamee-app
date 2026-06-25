import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

export type CardProps = PropsWithChildren<{
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: flameeTheme.colors.background,
    borderColor: flameeTheme.colors.border,
    borderRadius: flameeTheme.radii.xl,
    borderWidth: 1,
    maxWidth: '100%',
    padding: flameeTheme.spacing[4],
  },
  pressed: {
    opacity: 0.85,
  },
});
