import { useId } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({
  label,
  error,
  style,
  accessibilityHint,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const errorId = `field-error-${generatedId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <View style={styles.container}>
      <AppText variant="bodySmall">{label}</AppText>
      <TextInput
        {...props}
        accessibilityHint={error ?? accessibilityHint}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        placeholderTextColor={flameeTheme.colors.text.secondary}
        style={[styles.input, error && styles.inputError, style]}
      />
      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          color={flameeTheme.colors.accentRed}
          nativeID={errorId}
          variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: flameeTheme.spacing[1],
  },
  input: {
    backgroundColor: flameeTheme.colors.background,
    borderColor: flameeTheme.colors.border,
    borderRadius: flameeTheme.radii.md,
    borderWidth: 1,
    color: flameeTheme.colors.text.primary,
    height: 40,
    paddingHorizontal: flameeTheme.spacing[3],
  },
  inputError: {
    borderColor: flameeTheme.colors.accentRed,
  },
});
