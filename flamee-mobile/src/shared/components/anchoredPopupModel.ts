import { spacing } from "../constants/tokens.ts";

export type PopupAnchor = { x: number; y: number; width: number; height: number };
type Viewport = { width: number; height: number; top: number; bottom: number; left: number; right: number };

export function getAnchoredPopupLayout(anchor: PopupAnchor, viewport: Viewport, measuredHeight: number) {
  const leftEdge = viewport.left + spacing.lg;
  const rightEdge = viewport.width - viewport.right - spacing.lg;
  const topEdge = viewport.top + spacing.sm;
  const bottomEdge = viewport.height - viewport.bottom - spacing.sm;
  const maxHeight = Math.max(0, bottomEdge - topEdge);
  const width = Math.min(320, Math.max(0, rightEdge - leftEdge));
  const height = Math.min(measuredHeight, maxHeight);
  const below = anchor.y + anchor.height + spacing.sm;
  const above = anchor.y - spacing.sm - height;
  const top = below + height <= bottomEdge ? below : above >= topEdge ? above : Math.max(topEdge, Math.min(below, bottomEdge - height));
  return { top, left: Math.max(leftEdge, Math.min(anchor.x, rightEdge - width)), width, maxHeight };
}
