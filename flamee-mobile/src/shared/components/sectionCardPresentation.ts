import { cardTokens } from "../constants/tokens.ts";

export type SectionCardEmphasis = "default" | "action" | "flat";

export function getSectionCardPresentation(emphasis: SectionCardEmphasis, pressed: boolean) {
  if (emphasis === "flat") return { borderWidth: 0, borderColor: "transparent" as const, webShadow: "none", shadowColor: "$textPrimary" as const, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
  const action = emphasis === "action";
  const shadow = action
    ? pressed ? cardTokens.nativeActionPressedShadow : cardTokens.nativeActionShadow
    : pressed ? cardTokens.nativePressedShadow : cardTokens.nativeShadow;
  return {
    borderWidth: action ? 1 : 0,
    borderColor: action ? "$supportPeachLight" as const : "transparent" as const,
    webShadow: action
      ? pressed ? cardTokens.actionPressedShadow : cardTokens.actionShadow
      : pressed ? cardTokens.pressedShadow : cardTokens.shadow,
    ...shadow,
  };
}
