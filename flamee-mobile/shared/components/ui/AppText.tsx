import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { flameeFonts, flameeTheme, type FlameeTypographyVariant } from '@/shared/constants/flameeTheme';

export type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: FlameeTypographyVariant;
    color?: string;
    align?: 'left' | 'center' | 'right';
  }
>;

function resolveFontStyle(variant: FlameeTypographyVariant, customStyle?: TextStyle | TextStyle[]) {
  const baseTypography = (flameeTheme.typography[variant] || flameeTheme.typography.body) as TextStyle;
  
  if (!customStyle) {
    return baseTypography;
  }

  const flattened = StyleSheet.flatten(customStyle) as TextStyle;
  if (!flattened) {
    return baseTypography;
  }

  const { fontWeight, fontFamily, ...rest } = flattened;

  // Determine if variant or custom fontFamily calls for Rounded font
  const isRounded = (fontFamily || baseTypography.fontFamily || '').includes('Rounded');

  let resolvedFamily = fontFamily || baseTypography.fontFamily;

  if (fontWeight) {
    const w = String(fontWeight);
    if (w === 'bold' || w === '700' || w === '800' || w === '900') {
      resolvedFamily = isRounded ? flameeFonts.roundedBold : flameeFonts.bold;
    } else if (w === '600' || w === 'semibold') {
      resolvedFamily = isRounded ? flameeFonts.roundedSemibold : flameeFonts.bold;
    } else if (w === '500' || w === 'medium') {
      resolvedFamily = isRounded ? flameeFonts.roundedMedium : flameeFonts.medium;
    } else if (w === '400' || w === 'normal') {
      resolvedFamily = isRounded ? flameeFonts.roundedRegular : flameeFonts.regular;
    } else if (w === '300' || w === 'light') {
      resolvedFamily = isRounded ? flameeFonts.roundedRegular : flameeFonts.light;
    }
  }

  return [baseTypography, rest, { fontFamily: resolvedFamily }];
}

export function AppText({
  children,
  variant = 'body',
  color = flameeTheme.colors.text.primary,
  align = 'left',
  style,
  ...props
}: AppTextProps) {
  const flattenedStyle = StyleSheet.flatten(style as TextStyle);
  const finalColor = flattenedStyle?.color || color;

  return (
    <Text
      {...props}
      style={[
        resolveFontStyle(variant, style as TextStyle),
        { color: finalColor, textAlign: align },
      ]}>
      {children}
    </Text>
  );
}
