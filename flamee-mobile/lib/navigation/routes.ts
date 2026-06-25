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

export type MainNavItem = {
  key: Extract<FlameeRouteKey, 'home' | 'memories' | 'mood' | 'missions' | 'profile'>;
  label: string;
  icon: string;
  href: Href;
};

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home', href: ROUTES.home },
  { key: 'memories', label: 'Kỉ niệm', icon: 'heart', href: ROUTES.memories },
  { key: 'mood', label: 'Mood', icon: 'happy', href: ROUTES.mood },
  { key: 'missions', label: 'Nhiệm vụ', icon: 'checkmark-circle', href: ROUTES.missions },
  { key: 'profile', label: 'Profile', icon: 'person', href: ROUTES.profile },
];
