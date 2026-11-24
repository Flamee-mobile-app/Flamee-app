export type AppToastTone = "success" | "error" | "warning" | "info" | "loading" | "default";

export function getToastViewportFrame(width: number, insets: { top: number; left: number; right: number }, maxWidth: number, gutter: number, topGap: number) {
  const availableWidth = Math.max(0, width - insets.left - insets.right);
  const cardWidth = Math.max(0, Math.min(maxWidth, availableWidth - gutter * 2));
  return { width: cardWidth, left: insets.left + (availableWidth - cardWidth) / 2, top: insets.top + topGap };
}

type ToastColor = "$calmText" | "$accentText" | "$textPrimary" | "$textSecondary";

export function getAppToastPresentation(tone: AppToastTone): {
  textColor: ToastColor;
  liveMode: "polite" | "assertive";
  icon: "check" | "error" | "warning" | "info" | "loading";
  iconSurface: "$calmSurface" | "$accentSoft" | "$surfaceMuted";
} {
  if (tone === "success") return { textColor: "$calmText", liveMode: "polite", icon: "check", iconSurface: "$calmSurface" };
  if (tone === "error") return { textColor: "$accentText", liveMode: "assertive", icon: "error", iconSurface: "$accentSoft" };
  if (tone === "warning") return { textColor: "$accentText", liveMode: "polite", icon: "warning", iconSurface: "$accentSoft" };
  if (tone === "loading") return { textColor: "$textSecondary", liveMode: "polite", icon: "loading", iconSurface: "$surfaceMuted" };
  return { textColor: tone === "info" ? "$textPrimary" : "$textSecondary", liveMode: "polite", icon: "info", iconSurface: "$surfaceMuted" };
}

// Toast v2 forwards this native prop to its positioning wrapper on web.
// Adapt it through Tamagui's supported render prop rather than leaking it to HTML.
export function resolveToastWebWrapperProps(props: Record<string, unknown>): Record<string, unknown> {
  const { accessibilityLabel, ...domProps } = props;
  if (domProps["aria-label"] === undefined && accessibilityLabel !== undefined) {
    domProps["aria-label"] = accessibilityLabel;
  }
  return domProps;
}
