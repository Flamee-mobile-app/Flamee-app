import type { Href } from 'expo-router';

export const ROUTES = {
  start: '/',
  login: '/(auth)/login',
  register: '/(auth)/register',
  home: '/(main)/home',
  timeline: '/(main)/timeline',
  memories: '/(main)/memories',
  mood: '/(main)/mood',
  missions: '/(main)/missions',
  dates: '/(main)/dates',
  ai: '/(main)/ai',
  profile: '/(main)/profile',
} as const satisfies Record<string, Href>;

export type FlameeRouteKey = keyof typeof ROUTES;

export type BottomNavItem = {
  key: Extract<FlameeRouteKey, 'home' | 'memories' | 'missions' | 'profile'>;
  label: string;
  href: Href;
};

export const MAIN_NAV_PATHS = [
  ROUTES.home,
  ROUTES.memories,
  ROUTES.mood,
  ROUTES.missions,
  ROUTES.profile,
] as const;

export const BOTTOM_NAV_ITEMS = [
  { key: 'home', label: 'Trang chủ', href: ROUTES.home },
  { key: 'memories', label: 'Hoạt động', href: ROUTES.memories },
  { key: 'missions', label: 'Nhiệm vụ', href: ROUTES.missions },
  { key: 'profile', label: 'Hồ sơ', href: ROUTES.profile },
] as const satisfies readonly BottomNavItem[];

export function isMainNavigationPath(pathname: string) {
  return MAIN_NAV_PATHS.some((href) => String(href).replace('/(main)', '') === pathname);
}
