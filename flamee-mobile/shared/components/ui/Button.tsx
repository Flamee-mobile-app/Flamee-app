import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

import { AppText } from './AppText';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = styles[variant];
  const textColor = variant === 'primary' ? flameeTheme.colors.text.inverse : flameeTheme.colors.brand;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View>
          <AppText variant="body" color={textColor} align="center">
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: flameeTheme.radii.xl,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: flameeTheme.spacing[4],
  },
  primary: {
    backgroundColor: flameeTheme.colors.brand,
  },
  secondary: {
    backgroundColor: flameeTheme.colors.background,
    borderColor: flameeTheme.colors.brand,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
