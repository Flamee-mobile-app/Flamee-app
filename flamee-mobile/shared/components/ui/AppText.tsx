import type { PropsWithChildren } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { flameeTheme, type FlameeTypographyVariant } from '@/shared/constants/flameeTheme';

export type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: FlameeTypographyVariant;
    color?: string;
    align?: 'left' | 'center' | 'right';
  }
>;

export function AppText({
  children,
  variant = 'body',
  color = flameeTheme.colors.text.primary,
  align = 'left',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        flameeTheme.typography[variant] as TextStyle,
        { color, textAlign: align },
        style,
      ]}>
      {children}
    </Text>
  );
}
