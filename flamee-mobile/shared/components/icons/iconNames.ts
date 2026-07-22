export const FLAMEE_ICON_NAMES = [
  'home',
  'timeline',
  'missions',
  'profile',
  'mood',
  'ai',
] as const;

export type FlameeIconName = (typeof FLAMEE_ICON_NAMES)[number];
