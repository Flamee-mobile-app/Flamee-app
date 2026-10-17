import { Platform } from "react-native";
import { createElement } from "react";
import { defaultConfig } from "@tamagui/config/v4";
import { createFont, createTamagui } from "tamagui";
import { colors, radii, spacing, typography } from "./src/shared/constants/tokens";
import { resolveToastWebWrapperProps } from "./src/shared/components/appToastModel";

const fontSize = {
  caption: typography.caption.fontSize,
  bodyS: typography.bodyS.fontSize,
  bodyM: typography.bodyM.fontSize,
  bodyL: typography.bodyL.fontSize,
  button: typography.button.fontSize,
  // Button resolves its size token through the font scale, including its default.
  true: typography.button.fontSize,
  control: typography.button.fontSize,
  h5: typography.h5.fontSize,
  h4: typography.h4.fontSize,
  h3: typography.h3.fontSize,
  h2: typography.h2.fontSize,
  h1: typography.h1.fontSize,
};

const fontLineHeight = {
  caption: typography.caption.lineHeight,
  bodyS: typography.bodyS.lineHeight,
  bodyM: typography.bodyM.lineHeight,
  bodyL: typography.bodyL.lineHeight,
  button: typography.button.lineHeight,
  true: typography.button.lineHeight,
  control: typography.button.lineHeight,
  h5: typography.h5.lineHeight,
  h4: typography.h4.lineHeight,
  h3: typography.h3.lineHeight,
  h2: typography.h2.lineHeight,
  h1: typography.h1.lineHeight,
};

const fontWeight = {
  regular: typography.bodyS.fontWeight,
  medium: typography.bodyM.fontWeight,
  semibold: typography.h5.fontWeight,
  bold: typography.h1.fontWeight,
};

const fontLetterSpacing = Object.fromEntries(
  Object.keys(fontSize).map((key) => [key, 0]),
) as Record<keyof typeof fontSize, number>;

// Browsers do not recognize React Native's "System" family.
const systemFontFamily = Platform.OS === "web"
  ? "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  : "System";

const bodyFont = createFont({
  family: systemFontFamily,
  size: fontSize,
  lineHeight: fontLineHeight,
  weight: fontWeight,
  letterSpacing: fontLetterSpacing,
});

const headingFont = createFont({
  family: systemFontFamily,
  size: fontSize,
  lineHeight: fontLineHeight,
  weight: fontWeight,
  letterSpacing: fontLetterSpacing,
});

const semanticColors = {
  glassButton: colors.glassButton,
  glassFilter: colors.glassFilter,
  glassDialog: colors.glassDialog,
  glassCard: colors.glassCard,
  glassCardPeach: colors.glassCardPeach,
  glassCardLavender: colors.glassCardLavender,
  fieldSurface: colors.fieldSurface,
  fieldDisabled: colors.fieldDisabled,
  surface: colors.surface,
  surfaceMuted: colors.surfaceMuted,
  border: colors.border,
  accentSoft: colors.accentSoft,
  accentText: colors.accentText,
  calmSurface: colors.calmSurface,
  calmText: colors.calmText,
  moodVeryBadSurface: colors.moodVeryBadSurface,
  moodBadSurface: colors.moodBadSurface,
  moodNeutralSurface: colors.moodNeutralSurface,
  moodGoodSurface: colors.moodGoodSurface,
  moodGreatSurface: colors.moodGreatSurface,
};

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations: defaultConfig.animations,
  defaultProps: {
    ...(Platform.OS === "web" ? {
      ToastPositionWrapper: {
        render: (props: Record<string, unknown>) => createElement("div", resolveToastWebWrapperProps(props)),
      },
    } : {}),
  },
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  tokens: {
    ...defaultConfig.tokens,
    color: {
      primary: colors.primary,
      secondary: colors.secondary,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      background: colors.background,
      supportPeachLight: colors.supportPeachLight,
      supportPeach: colors.supportPeach,
      supportLavender: colors.supportLavender,
      supportLavenderLight: colors.supportLavenderLight,
      supportCoral: colors.supportCoral,
      warning: colors.warning,
      success: colors.success,
      error: colors.error,
      white: colors.white,
      ...semanticColors,
      muted: colors.supportPeachLight,
      moodVeryBad: colors.moodVeryBad,
      moodBad: colors.moodBad,
      moodNeutral: colors.moodNeutral,
      moodGood: colors.moodGood,
      moodGreat: colors.moodGreat,
    },
    space: {
      ...defaultConfig.tokens.space,
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
      xl: spacing.xl,
      xxl: spacing.xxl,
    },
    size: {
      ...defaultConfig.tokens.size,
      control: 48,
    },
    radius: {
      ...defaultConfig.tokens.radius,
      sm: radii.sm,
      md: radii.md,
      lg: radii.lg,
      xl: radii.xl,
    },
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: colors.background,
      backgroundHover: colors.surfaceMuted,
      backgroundPress: colors.accentSoft,
      backgroundFocus: colors.surfaceMuted,
      color: colors.textPrimary,
      colorHover: colors.textPrimary,
      colorPress: colors.textPrimary,
      colorFocus: colors.textPrimary,
      borderColor: colors.border,
      borderColorHover: colors.secondary,
      borderColorPress: colors.primary,
      borderColorFocus: colors.primary,
      primary: colors.primary,
      secondary: colors.secondary,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      supportPeachLight: colors.supportPeachLight,
      supportPeach: colors.supportPeach,
      supportLavender: colors.supportLavender,
      supportLavenderLight: colors.supportLavenderLight,
      supportCoral: colors.supportCoral,
      warning: colors.warning,
      success: colors.success,
      error: colors.error,
      white: colors.white,
      ...semanticColors,
      muted: colors.supportPeachLight,
      moodVeryBad: colors.moodVeryBad,
      moodBad: colors.moodBad,
      moodNeutral: colors.moodNeutral,
      moodGood: colors.moodGood,
      moodGreat: colors.moodGreat,
    },
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default tamaguiConfig;
