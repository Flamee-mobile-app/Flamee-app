import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';

import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <AppText variant="bodySmall">{label}</AppText>
      <TextInput
        {...props}
        placeholderTextColor={flameeTheme.colors.text.secondary}
        style={[styles.input, error && styles.inputError, style]}
      />
      {error ? (
        <AppText variant="caption" color={flameeTheme.colors.accentRed}>
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
