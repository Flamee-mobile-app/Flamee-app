import type { TextStyle } from 'react-native';

export const flameeFonts = {
  roundedBold: 'SF-Pro-Rounded-Bold',
  roundedSemibold: 'SF-Pro-Rounded-Semibold',
  roundedMedium: 'SF-Pro-Rounded-Medium',
  roundedRegular: 'SF-Pro-Rounded-Regular',
  bold: 'SF-Pro-Bold',
  medium: 'SF-Pro-Medium',
  regular: 'SF-Pro-Regular',
  light: 'SF-Pro-Light',
} as const;

export const flameeTheme = {
  colors: {
    brand: '#FF7158',
    brandSecondary: '#FCB76D',
    brandLight: '#FFF1E4',
    accentRed: '#E65C5C',
    background: '#FAF9F7',
    cream: '#FFF1E4',
    softCream: '#FFE6CE',
    
    // Colors from the brand's Figma concept palette
    neutral: {
      dark1: '#2B2B2B',
      dark2: '#555555',
      light: '#FAF9F7',
    },
    support: {
      cream: '#FFF1E4',
      mutedCoral: '#FF9B8A',
      peach: '#FFC7A1',
      purple: '#CDB4FF',
      lavender: '#DCCEF7',
    },
    semantic: {
      warning: '#F5B041',
      success: '#76E69F',
      danger: '#E65C5C',
    },

    text: {
      primary: '#2B2B2B',
      secondary: '#555555',
      inverse: '#FFFFFF',
      brand: '#FF7158',
      muted: 'rgba(43,43,43,0.3)',
    },
    success: '#76E69F',
    border: '#FCB76D',
    mutedSurface: '#FAF9F7',
    overlay: 'rgba(0,0,0,0.25)',
  },
  gradients: {
    brand: ['#FCB76D', '#FF7158'] as [string, string],
    brandH: ['#FCB76D', '#FF7158'] as [string, string],    // left→right
    brandDiag: ['#FCB76D', '#FF7158'] as [string, string], // 225deg
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    card: 32,
    panel: 63,
    full: 999,
  },
  fonts: flameeFonts,
  typography: {
    display: { fontFamily: flameeFonts.roundedBold, fontSize: 32, lineHeight: 38 },
    heading: { fontFamily: flameeFonts.roundedBold, fontSize: 28, lineHeight: 34 },
    title: { fontFamily: flameeFonts.roundedBold, fontSize: 24, lineHeight: 30 },
    sectionTitle: { fontFamily: flameeFonts.roundedBold, fontSize: 20, lineHeight: 26 },
    subtitle: { fontFamily: flameeFonts.roundedSemibold, fontSize: 18, lineHeight: 22 },
    body: { fontFamily: flameeFonts.medium, fontSize: 16, lineHeight: 22 },
    bodyRegular: { fontFamily: flameeFonts.regular, fontSize: 16, lineHeight: 22 },
    bodySmall: { fontFamily: flameeFonts.regular, fontSize: 14, lineHeight: 20 },
    caption: { fontFamily: flameeFonts.regular, fontSize: 12, lineHeight: 16 },
    micro: { fontFamily: flameeFonts.light, fontSize: 10, lineHeight: 12 },
  } satisfies Record<string, TextStyle>,
} as const;

export type FlameeTypographyVariant = keyof typeof flameeTheme.typography;
