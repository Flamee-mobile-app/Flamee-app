import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type IconButtonProps = {
  name: IconName;
  onPress?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function IconButton({
  name,
  onPress,
  color = flameeTheme.colors.text.primary,
  backgroundColor = flameeTheme.colors.cream,
  size = 22,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, height: size + 20, width: size + 20 },
        style,
        pressed && styles.pressed,
      ]}>
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: flameeTheme.radii.full,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
