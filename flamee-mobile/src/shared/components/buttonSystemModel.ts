import { buttonTokens, noteComposerLayoutTokens } from "../constants/tokens.ts";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
export type AppButtonContentAlign = "center" | "start";
export type FilterSelectionMode = "single" | "multiple";

type ButtonBasePresentation = {
  borderWidth?: number;
  borderColor?: ButtonColor;
  backgroundColor: ButtonColor;
  color: ButtonColor;
  shadowColor: ButtonColor;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

type ButtonPresentation = {
  base: ButtonBasePresentation;
  hover: { backgroundColor?: ButtonColor; opacity?: number };
  press: {
    backgroundColor: ButtonColor;
    transform: { translateY: number }[];
    shadowColor: ButtonColor;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
};

type ButtonColor =
  | "$primary"
  | "$secondary"
  | "$white"
  | "$accentSoft"
  | "$accentText"
  | "$textPrimary"
  | "$error"
  | "$surface"
  | "$surfaceMuted"
  | "$border"
  | "$supportPeach"
  | "$supportPeachLight"
  | "$glassButton"
  | "$glassFilter"
  | "$glassCardPeach"
  | "transparent";

const buttonPresentations: Record<AppButtonVariant, ButtonPresentation> = {
  outline: {
    base: { backgroundColor: "transparent", color: "$textPrimary", borderColor: "$border", borderWidth: 1, shadowColor: "$textPrimary", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    hover: { backgroundColor: "$surfaceMuted" },
    press: { backgroundColor: "$surfaceMuted", transform: [{ translateY: buttonTokens.pressOffset }], shadowColor: "$textPrimary", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  },
  primary: {
    base: {
      backgroundColor: "$primary",
      color: "$white",
      shadowColor: "$textPrimary",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 3,
    },
    hover: {},
    press: {
      backgroundColor: "$primary",
      transform: [{ translateY: buttonTokens.pressOffset }],
      shadowColor: "$textPrimary",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 1,
      elevation: 1,
    },
  },
  secondary: {
    base: {
      backgroundColor: "$accentSoft",
      color: "$accentText",
      shadowColor: "$textPrimary",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },
    hover: {},
    press: {
      backgroundColor: "$accentSoft",
      transform: [{ translateY: buttonTokens.pressOffset }],
      shadowColor: "$textPrimary",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 1,
      elevation: 0,
    },
  },
  ghost: {
    base: {
      backgroundColor: "$glassButton",
      borderWidth: 0,
      borderColor: "transparent",
      color: "$textPrimary",
      shadowColor: "$textPrimary",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.09,
      shadowRadius: 6,
      elevation: 1,
    },
    hover: {},
    press: {
      backgroundColor: "$glassButton",
      transform: [{ translateY: buttonTokens.pressOffset }],
      shadowColor: "$textPrimary",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 0,
    },
  },
  destructive: {
    base: {
      backgroundColor: "$error",
      color: "$white",
      shadowColor: "$textPrimary",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 4,
      elevation: 2,
    },
    hover: {},
    press: {
      backgroundColor: "$error",
      transform: [{ translateY: buttonTokens.pressOffset }],
      shadowColor: "$textPrimary",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 1,
      elevation: 1,
    },
  },
};

export function getAppButtonPresentation(variant: AppButtonVariant): ButtonPresentation {
  return buttonPresentations[variant];
}

export type IconButtonTone = "neutral" | "accent" | "avatar" | "danger" | "plain" | "send" | "composer";

export function getIconButtonPresentation(tone: IconButtonTone, selected: boolean) {
  if (tone === "send") return {
    backgroundColor: "$supportPeach", color: "$white",
    hoverBackgroundColor: "$supportPeach", pressBackgroundColor: "$supportPeach",
  } as const;
  if (tone === "plain") {
    return {
      backgroundColor: "transparent",
      color: "$textPrimary",
      hoverBackgroundColor: "transparent",
      pressBackgroundColor: "transparent",
    } as const;
  }

  if (tone === "accent") {
    return {
      backgroundColor: selected ? "$supportPeach" : "$accentSoft",
      color: "$accentText",
      hoverBackgroundColor: selected ? "$supportPeach" : "$accentSoft",
      pressBackgroundColor: selected ? "$supportPeach" : "$accentSoft",
    } as const;
  }

  if (tone === "avatar") {
    return {
      backgroundColor: "$glassCardPeach",
      color: "$accentText",
      hoverBackgroundColor: "$glassCardPeach",
      pressBackgroundColor: "$glassCardPeach",
    } as const;
  }

  if (tone === "composer") return selected ? {
    backgroundColor: "$accentSoft", color: "$accentText", borderColor: "$primary", borderWidth: noteComposerLayoutTokens.toolBorderWidth,
    hoverBackgroundColor: "$accentSoft", pressBackgroundColor: "$accentSoft",
  } as const : {
    backgroundColor: "$white", color: "$accentText", borderColor: "transparent", borderWidth: noteComposerLayoutTokens.toolBorderWidth,
    hoverBackgroundColor: "$white", pressBackgroundColor: "$white",
  } as const;

  if (tone === "danger") {
    return {
      backgroundColor: selected ? "$error" : "$surface",
      color: selected ? "$white" : "$error",
      hoverBackgroundColor: selected ? "$error" : "$surface",
      pressBackgroundColor: selected ? "$error" : "$surface",
    } as const;
  }

  return {
    backgroundColor: selected ? "$accentSoft" : "$surface",
    color: "$textPrimary",
    hoverBackgroundColor: selected ? "$accentSoft" : "$surface",
    pressBackgroundColor: selected ? "$accentSoft" : "$surface",
  } as const;
}

export function getIconButtonRadius(tone: IconButtonTone) {
  if (tone === "send") return buttonTokens.sendButtonSize / 2;
  if (tone === "plain") return 0;
  if (tone === "avatar" || tone === "composer") return buttonTokens.iconButtonSize / 2;
  return buttonTokens.iconButtonRadius;
}

export type FilterChipPresentation = "filter" | "choice" | "segment" | "tab";

export function getFilterChipPresentation(selected: boolean, presentation: FilterChipPresentation = "filter") {
  if (presentation === "segment" || presentation === "tab") {
    const filled = selected && presentation === "segment";
    return { borderWidth: 0, borderColor: "transparent", backgroundColor: filled ? "$primary" : "transparent", selectionBackgroundColor: "$primary", selectionOpacity: 0, color: filled ? "$white" : selected ? "$primary" : "$textSecondary", hoverBackgroundColor: "$surfaceMuted", pressBackgroundColor: "$surfaceMuted" } as const;
  }
  if (presentation === "choice") {
    const color = selected ? "$primary" : "$white";
    return {
      borderWidth: 1,
      borderColor: selected ? "$primary" : "$border",
      backgroundColor: color,
      selectionBackgroundColor: color,
      selectionOpacity: 1,
      color: selected ? "$white" : "$textPrimary",
      hoverBackgroundColor: color,
      pressBackgroundColor: color,
    } as const;
  }

  return {
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: selected ? "$accentSoft" : "$glassFilter",
    selectionBackgroundColor: "$accentSoft",
    selectionOpacity: selected ? 1 : 0,
    color: selected ? "$accentText" : "$textSecondary",
    hoverBackgroundColor: selected ? "$accentSoft" : "$glassFilter",
    pressBackgroundColor: selected ? "$accentSoft" : "$glassFilter",
  } as const;
}

export function getAppButtonDisabledPresentation(tone: "default" | "muted") {
  return {
    backgroundColor: tone === "muted" ? "$surfaceMuted" as const : undefined,
    color: tone === "muted" ? "$textPrimary" as const : undefined,
    shadowOpacity: tone === "muted" ? 0 : undefined,
    shadowRadius: tone === "muted" ? 0 : undefined,
    elevation: tone === "muted" ? 0 : undefined,
    opacity: tone === "muted" ? 1 : buttonTokens.disabledOpacity,
  };
}

export function resolveAppButtonState({
  disabled = false,
  loading = false,
}: {
  disabled?: boolean;
  loading?: boolean;
}) {
  return {
    disabled: disabled || loading,
    busy: loading,
    contentOpacity: loading ? 0 : 1,
  } as const;
}

export function resolveAppButtonLayout({
  fill = false,
  grow = false,
  contentAlign = "center",
}: {
  fill?: boolean;
  grow?: boolean;
  contentAlign?: AppButtonContentAlign;
}) {
  return {
    alignSelf: fill ? ("stretch" as const) : ("auto" as const),
    flex: grow ? 1 : undefined,
    minWidth: grow ? 0 : undefined,
    justifyContent: contentAlign === "start" ? ("flex-start" as const) : ("center" as const),
  };
}

export function resolveFilterSemantics(selectionMode: FilterSelectionMode, selected: boolean) {
  return {
    role: selectionMode === "single" ? ("radio" as const) : ("checkbox" as const),
    checked: selected,
  };
}

export function resolvePlatformAccessibilityProps<T extends Record<string, boolean>>(
  platform: string,
  accessibilityState: T,
): {} | { accessibilityState: T } {
  return platform === "web" ? {} : { accessibilityState };
}
