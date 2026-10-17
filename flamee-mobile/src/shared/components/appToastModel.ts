export type AppToastTone = "success" | "error" | "warning" | "info" | "loading" | "default";

type ToastColor = "$calmText" | "$accentText" | "$textPrimary" | "$textSecondary";

export function getAppToastPresentation(tone: AppToastTone): {
  textColor: ToastColor;
  liveMode: "polite" | "assertive";
} {
  if (tone === "success") return { textColor: "$calmText", liveMode: "polite" };
  if (tone === "error") return { textColor: "$accentText", liveMode: "assertive" };
  if (tone === "warning") return { textColor: "$accentText", liveMode: "polite" };
  if (tone === "info") return { textColor: "$textPrimary", liveMode: "polite" };
  return { textColor: "$textSecondary", liveMode: "polite" };
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
