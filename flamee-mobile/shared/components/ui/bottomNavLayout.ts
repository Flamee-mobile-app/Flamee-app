import type { ViewStyle } from 'react-native';

import type { BottomNavItem } from '@/shared/lib/navigation/routes';

export const FIGMA_BOTTOM_NAV_WIDTH = 402;

type FigmaTabLayout = Readonly<{
  left: number;
  top: number;
  width: number;
}>;

export type BottomNavTabLayout = Pick<ViewStyle, 'left' | 'top' | 'width'>;

const FIGMA_TAB_LAYOUT: Record<BottomNavItem['key'], FigmaTabLayout> = {
  home: { left: 23, top: 15, width: 57 },
  timeline: { left: 100, top: 15, width: 60 },
  missions: { left: 242, top: 12, width: 55 },
  profile: { left: 321, top: 12, width: 34 },
};

export function getBottomNavTabLayout(
  key: BottomNavItem['key'],
  barWidth: number,
): BottomNavTabLayout {
  const layout = FIGMA_TAB_LAYOUT[key];
  const scale = barWidth / FIGMA_BOTTOM_NAV_WIDTH;

  return {
    left: layout.left * scale,
    top: layout.top,
    width: layout.width * scale,
  };
}
