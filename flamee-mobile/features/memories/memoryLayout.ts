import { flameeTheme } from '@/constants/flameeTheme';

export const MEMORY_LAYOUT = {
  horizontalPadding: flameeTheme.spacing[6],
  maxContentWidth: 402 - flameeTheme.spacing[6] * 2,
  gridGap: flameeTheme.spacing[4],
  sectionGap: flameeTheme.spacing[6],
  bottomNavClearance: 112,
  actionMinHeight: 44,
  inputMinHeight: 52,
  floatingActionSize: 56,
} as const;

export function getMemoryContentWidth(viewportWidth: number) {
  return Math.min(
    Math.max(viewportWidth - MEMORY_LAYOUT.horizontalPadding * 2, 0),
    MEMORY_LAYOUT.maxContentWidth,
  );
}

export function getMemoryGridItemWidth(contentWidth: number) {
  return Math.max((contentWidth - MEMORY_LAYOUT.gridGap) / 2, 0);
}
