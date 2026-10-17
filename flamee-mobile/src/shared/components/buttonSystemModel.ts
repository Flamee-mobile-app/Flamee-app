import { buttonTokens } from "../constants/tokens.ts";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
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
  | "$supportPeach"
  | "$supportPeachLight"
  | "$glassButton"
  | "$glassFilter"
  | "transparent";

const buttonPresentations: Record<AppButtonVariant, ButtonPresentation> = {
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

export type IconButtonTone = "neutral" | "accent" | "danger";

export function getIconButtonPresentation(tone: IconButtonTone, selected: boolean) {
  if (tone === "accent") {
    return {
      backgroundColor: selected ? "$supportPeach" : "$accentSoft",
      color: "$accentText",
      hoverBackgroundColor: selected ? "$supportPeach" : "$accentSoft",
      pressBackgroundColor: selected ? "$supportPeach" : "$accentSoft",
    } as const;
  }

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

export function getFilterChipPresentation(selected: boolean) {
  return {
    borderColor: "transparent",
    backgroundColor: selected ? "$accentSoft" : "$glassFilter",
    selectionBackgroundColor: "$accentSoft",
    selectionOpacity: selected ? 1 : 0,
    color: selected ? "$accentText" : "$textSecondary",
    hoverBackgroundColor: selected ? "$accentSoft" : "$glassFilter",
    pressBackgroundColor: selected ? "$accentSoft" : "$glassFilter",
  } as const;
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
