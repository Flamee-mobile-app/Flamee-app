import { sheetTokens } from "../constants/tokens.ts";

/** A fixed capacity bound, independent of the child's changing content height. */
export function getSheetBodyCapacity({ viewportHeight, topInset, headerHeight, footerHeight, paddingVertical, gap, keyboardHeight = 0 }: {
  viewportHeight: number; topInset: number; headerHeight: number; footerHeight: number; paddingVertical: number; gap: number; keyboardHeight?: number;
}) {
  const maximum = Math.min(viewportHeight * sheetTokens.maxViewportRatio, viewportHeight - topInset - keyboardHeight);
  return Math.max(0, Math.floor(maximum - headerHeight - footerHeight - paddingVertical - gap));
}
