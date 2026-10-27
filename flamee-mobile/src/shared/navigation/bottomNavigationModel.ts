import { navigationTokens } from "../constants/tokens.ts";

const MAX_BAR_WIDTH = 480;
const MIN_HORIZONTAL_INSET = 16;
const BASELINE_WIDTH = 390;

export type BottomNavigationLayout = {
  width: number;
  horizontalInset: number;
  bottomInset: number;
  scale: number;
  barTop: number;
  barHeight: number;
  fabSize: number;
  fabOutlineWidth: number;
  notchRadius: number;
  radialRadius: number;
  totalHeight: number;
};

export type RadialMenuPosition = { x: number; y: number };

export type BottomNavigationSelection = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};

export function getBottomNavigationLayout(viewportWidth: number, safeAreaBottom: number): BottomNavigationLayout {
  const availableWidth = Math.max(0, viewportWidth - MIN_HORIZONTAL_INSET * 2);
  const width = Math.min(MAX_BAR_WIDTH, availableWidth);
  const horizontalInset = (viewportWidth - width) / 2;
  const bottomInset = Math.round(Math.min(18, Math.max(14, safeAreaBottom * 0.5)) * 10) / 10;
  const scale = Math.max(0.86, Math.min(1.08, width / BASELINE_WIDTH));
  const fabSize = 56 * scale;
  const fabOutlineWidth = 2 * scale;
  const barTop = fabSize / 2 + 5 * scale;
  const barHeight = 60 * scale;
  const notchRadius = (fabSize + 14 * scale) / 2;
  const radialRadius = Math.max(96, 104 * scale);

  return {
    width,
    horizontalInset,
    bottomInset,
    scale,
    barTop,
    barHeight,
    fabSize,
    fabOutlineWidth,
    notchRadius,
    radialRadius,
    totalHeight: barTop + barHeight + bottomInset,
  };
}

export function getBottomNavigationFrame(layout: BottomNavigationLayout) {
  return {
    left: layout.horizontalInset,
    bottom: layout.bottomInset,
    width: layout.width,
    height: layout.barTop + layout.barHeight,
  };
}

export function getBottomNavigationOverlayStyle(layout: BottomNavigationLayout) {
  return {
    position: "absolute" as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: layout.totalHeight,
  };
}

export function getRadialMenuPositions(count: number, radius: number): RadialMenuPosition[] {
  if (count <= 0) return [];
  const startAngle = count === 1 ? 270 : count >= 4 ? 200 : 210;
  const endAngle = count === 1 ? 270 : count >= 4 ? 340 : 330;

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + (endAngle - startAngle) * index / Math.max(1, count - 1);
    const radians = angle * Math.PI / 180;
    return { x: Math.cos(radians) * radius, y: Math.sin(radians) * radius };
  });
}

export function resolveFabPress(longPressOpened: boolean): "primary" | "radial-menu" {
  return longPressOpened ? "radial-menu" : "primary";
}

export function getNavigationIconEmphasis(focused: boolean) {
  return focused
    ? { opacity: 1, strokeWidth: 2.8 }
    : { opacity: 0.68, strokeWidth: 1.8 };
}

export function getBottomNavigationSelection(layout: BottomNavigationLayout, tabIndex: number): BottomNavigationSelection | null {
  if (!Number.isInteger(tabIndex) || tabIndex < 0 || tabIndex > 3) return null;
  const inset = navigationTokens.selectionInset * layout.scale;
  const groupWidth = layout.width / 2 - layout.notchRadius;
  const tabWidth = groupWidth / 2;
  const groupLeft = tabIndex < 2 ? 0 : layout.width / 2 + layout.notchRadius;
  const height = layout.barHeight - inset * 2;
  return {
    x: groupLeft + (tabIndex % 2) * tabWidth + inset,
    y: layout.barTop + inset,
    width: tabWidth - inset * 2,
    height,
    radius: height / 2,
  };
}

export function buildBottomBarPath({
  width,
  barTop,
  barHeight,
  notchRadius,
}: Pick<BottomNavigationLayout, "width" | "barTop" | "barHeight" | "notchRadius">): string {
  const centerX = width / 2;
  const bottom = barTop + barHeight;
  const cornerRadius = barHeight / 2;
  const notchLeft = centerX - notchRadius;
  const notchRight = centerX + notchRadius;

  return [
    `M ${cornerRadius} ${barTop}`,
    `H ${notchLeft}`,
    `A ${notchRadius} ${notchRadius} 0 0 0 ${notchRight} ${barTop}`,
    `H ${width - cornerRadius}`,
    `Q ${width} ${barTop} ${width} ${barTop + cornerRadius}`,
    `V ${bottom - cornerRadius}`,
    `Q ${width} ${bottom} ${width - cornerRadius} ${bottom}`,
    `H ${cornerRadius}`,
    `Q 0 ${bottom} 0 ${bottom - cornerRadius}`,
    `V ${barTop + cornerRadius}`,
    `Q 0 ${barTop} ${cornerRadius} ${barTop}`,
    "Z",
  ].join(" ");
}
