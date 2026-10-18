const appBackground = "#F8F5F1";
const startupDuration = 2720;
const startupTaglineEnd = 2320;

export const colors = {
  primary: "#FF7158",
  secondary: "#FCB76D",
  textPrimary: "#302924",
  textSecondary: "#70655D",
  background: appBackground,
  surface: "#FFFCF8",
  surfaceMuted: "#F0EAE3",
  border: "#E6DDD3",
  accentSoft: "#F7DDCC",
  accentText: "#9A4234",
  calmSurface: "#EDF1E9",
  calmText: "#52634C",
  supportPeachLight: "#FFE6CE",
  supportPeach: "#FFC7A1",
  supportLavender: "#CDB4FF",
  supportLavenderLight: "#DCCEF7",
  supportCoral: "#FF9B8A",
  warning: "#F5B041",
  success: "#76E69F",
  error: "#E65C5C",
  white: "#FFFFFF",
  glassButton: "rgba(255, 255, 255, 0.14)",
  glassFilter: "rgba(255, 255, 255, 0.52)",
  glassDialog: "rgba(255, 252, 248, 0.48)",
  glassHeader: "rgba(255, 252, 248, 0.88)",
  glassCard: "rgba(255, 252, 248, 0.66)",
  glassCardPeach: "rgba(247, 221, 204, 0.38)",
  glassCardLavender: "rgba(220, 206, 247, 0.20)",
  fieldSurface: "rgba(240, 234, 227, 0.52)",
  fieldDisabled: "rgba(240, 234, 227, 0.32)",
  moodVeryBad: "#E65C5C",
  moodBad: "#F5B041",
  moodNeutral: "#CDB4FF",
  moodGood: "#FCB76D",
  moodGreat: "#76E69F",
  moodVeryBadSurface: "#F4E4E0",
  moodBadSurface: "#F4EBDA",
  moodNeutralSurface: "#ECE7F1",
  moodGoodSurface: "#FAE8D7",
  moodGreatSurface: "#E6EDE3",
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

export const toastTokens = {
  maxWidth: 420,
  minHeight: 56,
  radius: 20,
  paddingHorizontal: 18,
  paddingVertical: 16,
  duration: 3000,
} as const;

export const sheetTokens = { snapPoint: 55, overlayOpacity: 0.45, zIndex: 100_000 } as const;

export const menuTokens = {
  rowMinHeight: 52,
  iconSize: 20,
  chevronSize: 18,
  pressOffset: 1,
  separatorInset: 32,
} as const;

export const fieldTokens = {
  minHeight: 52,
  multilineMinHeight: 112,
  radius: 18,
  paddingHorizontal: 16,
  paddingVertical: 14,
  focusDuration: 160,
  focusLift: 1,
  errorIconSize: 16,
  surfaceShadow: "inset 0 1px 3px rgba(48,41,36,0.08)",
  focusShadow: "0 2px 6px rgba(48,41,36,0.08)",
  nativeFocusShadow: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
} as const;

export const glassTokens = {
  buttonBlur: 16,
  filterBlur: 6,
  dialogBlur: 28,
  nativeDialogBlur: 48,
  cardBlur: 12,
  cardBackdrop: "blur(12px) saturate(115%)",
  buttonBackdrop: "blur(16px) saturate(160%)",
  dialogBackdrop: "blur(28px) saturate(135%)",
  buttonSheen: "linear-gradient(135deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.03) 48%, rgba(255,255,255,0.12) 100%)",
  dialogSheen: "linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.03) 65%, rgba(255,255,255,0.10) 100%)",
  buttonShadow: "inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 0 rgba(255,255,255,0.25), 0 4px 12px rgba(48,41,36,0.08)",
  buttonPressedShadow: "inset 0 1px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(255,255,255,0.18), 0 1px 4px rgba(48,41,36,0.05)",
  dialogReflection: "inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(255,255,255,0.22), 0 18px 48px rgba(48,41,36,0.16)",
  overlayOpacity: 0.32,
  dialogShadow: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
    elevation: 6,
  },
} as const;

export const cardTokens = {
  radius: 22,
  padding: 20,
  compactRadius: 18,
  compactPaddingHorizontal: 16,
  compactPaddingVertical: 8,
  pressOffset: 1,
  shadow: "0 2px 8px rgba(48,41,36,0.06)",
  pressedShadow: "0 1px 2px rgba(48,41,36,0.04)",
  nativeShadow: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  nativePressedShadow: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 0,
  },
} as const;

export const choiceTokens = { width: 72, height: 108, artworkSize: 56 } as const;

export const navigationTokens = {
  selectionBackground: colors.supportPeach,
  activeIconColor: colors.surface,
  inactiveIconColor: colors.white,
  tabIconSize: 30,
  profileAvatarSize: 40,
  selectionInset: 6,
  selectionDuration: 240,
  emphasisDuration: 160,
  badgeBackground: "#FFF1E8",
  badgeText: "#9A3E2F",
  badgeBorder: "#FFC7A1",
  menuOpenDuration: 190,
  menuCloseDuration: 160,
  fabPressLift: 3,
  fabPressRiseDuration: 80,
  fabPressSettleDuration: 180,
  fabPressHighlightOpacity: 0.14,
} as const;

export const buttonTokens = {
  height: 48,
  radius: 16,
  paddingHorizontal: 16,
  iconSize: 18,
  iconGap: 8,
  filterHeight: 32,
  filterHitSlop: 8,
  filterRadius: 12,
  filterPaddingHorizontal: 12,
  filterPressOffset: 1,
  filterSelectionDuration: 160,
  iconButtonSize: 44,
  iconButtonHitSlop: 2,
  iconButtonRadius: 14,
  avatarEditShadow: "0 4px 12px rgba(48,41,36,0.14)",
  avatarEditNativeShadow: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  interactionDuration: 140,
  pressDuration: 80,
  pressOffset: 3,
  disabledOpacity: 0.48,
} as const;

export const controlTokens = {
  touchSize: 48,
  pressOffset: 1,
  switch: {
    targetWidth: 60,
    trackWidth: 52,
    trackHeight: 30,
    thumbSize: 24,
    inset: 3,
    duration: 180,
    trackShadow: "inset 0 1px 3px rgba(48,41,36,0.16)",
    thumbShadow: {
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 3,
    },
  },
  checkbox: {
    size: 24,
    radius: 8,
    iconSize: 16,
    duration: 160,
    surfaceShadow: "inset 0 1px 2px rgba(48,41,36,0.12)",
  },
} as const;

export const homeTokens = {
  maxWidth: 560,
  moodIconSize: 34,
  moodTileSize: 40,
  avatarSize: 48,
  navigationClearance: 116,
} as const;

export const memoryFeedTokens = {
  maxWidth: 560,
  headerHeight: 60,
  compactHeaderHeight: 48,
  headerScrollTransition: 300,
  headerCollapseOffset: 96,
  headerCollapseTravel: 56,
  headerRevealTravel: 48,
  headerTopThreshold: 16,
  expandedHeaderHeight: 136,
  expandedHeaderRadius: 28,
  headerTransition: 200,
  gutter: 20,
  postGap: 36,
  gridGap: 12,
  avatarSize: 34,
  photoRadius: 18,
  photoAspectRatio: 4 / 3,
  iconSize: 24,
  navigationClearance: 116,
} as const;

export const photoPickerTokens = { height: 156, radius: 18, iconSize: 24, pressOffset: 1, previewViewportRatio: 0.43 } as const;

export const memoryComposerTokens = { snapPoints: [85, 55], initialPosition: 1 };

export const featureTokens = {
  maxWidth: 560,
  navigationClearance: 116,
  surfaceShadow: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
} as const;

export const homeShadows = {
  card: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  hero: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 6,
  },
} as const;

// The custom startup uses a warm dark surface so its ember trails retain depth.
export const startupTokens = {
  background: "#24110F",
  backgroundDeep: "#120807",
  backgroundGlow: "#5A2019",
  coral: "#FF7461",
  amber: "#FDB872",
  peach: "#FFE6CE",
  tagline: "#F7D5C3",
  wordmarkTop: "#FF8A4C",
  wordmarkBottom: "#FF4E6B",
  duration: startupDuration,
  playbackDuration: 2450,
  exitDuration: 650,
  contentRevealDelay: 350,
  exitArtworkLift: 72,
  exitArtworkScale: 0.9,
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
  glowSize: 280,
  letterSpacing: 2.4,
  dotSize: 3,
  emberSize: 8,
  emberGlowSize: 38,
  connectionStart: 80,
  connectionEnd: 540,
  heartDrawStart: 580,
  heartDrawEnd: 1320,
  // Keep the fully formed heart on screen before the brand symbol morph begins.
  heartCompleteHold: 180,
  flameStart: 1500,
  flameEnd: 1900,
  wordmarkStart: 1940,
  wordmarkEnd: 2160,
  taglineStart: 2200,
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
