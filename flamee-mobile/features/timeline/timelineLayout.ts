import { flameeTheme } from '@/shared/constants/flameeTheme';

export const TIMELINE_LAYOUT = {
  horizontalPadding: flameeTheme.spacing[6],
  maxContentWidth: 402 - flameeTheme.spacing[6] * 2,
  gridGap: flameeTheme.spacing[4],
  sectionGap: flameeTheme.spacing[6],
  bottomNavClearance: 112,
  actionMinHeight: 44,
  inputMinHeight: 52,
  floatingActionSize: 56,
} as const;

export function getTimelineContentWidth(viewportWidth: number) {
  return Math.min(
    Math.max(viewportWidth - TIMELINE_LAYOUT.horizontalPadding * 2, 0),
    TIMELINE_LAYOUT.maxContentWidth,
  );
}

export function getTimelineGridItemWidth(contentWidth: number) {
  return Math.max((contentWidth - TIMELINE_LAYOUT.gridGap) / 2, 0);
}
