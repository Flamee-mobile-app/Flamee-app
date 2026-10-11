const appBackground = "#FFF4EC";
const startupDuration = 2460;
const startupTaglineEnd = 2150;

export const colors = {
  primary: "#FF7158",
  secondary: "#FCB76D",
  textPrimary: "#2B2B2B",
  textSecondary: "#555555",
  background: appBackground,
  supportPeachLight: "#FFE6CE",
  supportPeach: "#FFC7A1",
  supportLavender: "#CDB4FF",
  supportLavenderLight: "#DCCEF7",
  supportCoral: "#FF9B8A",
  warning: "#F5B041",
  success: "#76E69F",
  error: "#E65C5C",
  white: "#FFFFFF",
  moodVeryBad: "#E65C5C",
  moodBad: "#F5B041",
  moodNeutral: "#CDB4FF",
  moodGood: "#FCB76D",
  moodGreat: "#76E69F",
} as const;

export const brandGradient = [colors.secondary, colors.primary] as const;

// The brand guide names SF families, but the source font binaries are not present.
// Use system fonts until licensed font assets are supplied and configured.
export const typography = {
  h1: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
  h2: { fontSize: 28, lineHeight: 36, fontWeight: "700" as const },
  h3: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
  h4: { fontSize: 20, lineHeight: 28, fontWeight: "700" as const },
  h5: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  bodyL: { fontSize: 16, lineHeight: 24, fontWeight: "500" as const },
  bodyM: { fontSize: 14, lineHeight: 20, fontWeight: "500" as const },
  bodyS: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
  caption: { fontSize: 10, lineHeight: 14, fontWeight: "400" as const },
  button: { fontSize: 16, lineHeight: 24, fontWeight: "500" as const },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radii = { sm: 8, md: 12, lg: 20, xl: 28 } as const;

// A pale paper background lets the startup logo retain the strongest color.
export const startupTokens = {
  background: appBackground,
  coral: "#FF7461",
  amber: "#FDB872",
  peach: "#FFE6CE",
  tagline: "#5A2A27",
  wordmarkTop: "#FF8A4C",
  wordmarkBottom: "#FF4E6B",
  duration: startupDuration,
  playbackDuration: 1600,
  exitDuration: 640,
  initializationTimeout: 15000,
  breatheDuration: 1600,
  canvasSize: 320,
  maxCanvasSize: 360,
  textReserve: 132,
  logoWidth: 150,
  wordmarkWidth: 204,
  heartX: 160,
  heartY: 208,
  wordmarkY: 254,
  heartSize: 42,
  ringSize: 116,
  glowSize: 280,
  letterSpacing: 2.4,
  dotSize: 3,
  connectionStart: 250,
  connectionEnd: 700,
  flameStart: 550,
  flameEnd: 1450,
  wordmarkStart: 1200,
  wordmarkEnd: 1850,
  taglineStart: 1700,
  taglineEnd: startupTaglineEnd,
} as const;

export const loginTokens = {
  screenMaxWidth: 520,
  heroMinHeight: 260,
  heroLogoWidth: 144,
  heroLogoHeight: 48,
  heroLogoTopGap: spacing.sm,
  heroImageAspectRatio: 1638 / 890,
  heroImageWidthRatio: 2,
  heroImageHorizontalAnchor: 0.34,
  heroOverlayOpacity: 0.12,
  formOverlap: 28,
  linkTouchHeight: 44,
  checkboxSize: 20,
  checkboxRadius: 6,
  googleLogoSize: 20,
  maxWidth: 380,
  copyWidth: 284,
  controlHeight: 48,
  socialHeight: 48,
  symbolWidth: 44,
  wordmarkWidth: 136,
  entranceDuration: 340,
  entranceDelay: 0,
  stagger: 40,
  maxEntranceDelay: 240,
  actionFadeDuration: 400,
  socialFadeDuration: 380,
} as const;
