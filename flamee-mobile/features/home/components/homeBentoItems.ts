import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

import { ROUTES } from '@/shared/lib/navigation/routes';

export type HomeBentoItem = {
  id: 'mood' | 'ai' | 'timeline' | 'dates' | 'memory-book' | 'missions';
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  mode: 'push' | 'replace';
};

export const HOME_BENTO_ITEMS: readonly HomeBentoItem[] = [
  {
    id: 'mood',
    label: 'Mood check-in',
    subtitle: 'Chạm nhẹ để lắng nghe cảm xúc hôm nay.',
    icon: 'happy-outline',
    route: ROUTES.mood,
    mode: 'replace',
  },
  {
    id: 'ai',
    label: 'Chat AI',
    subtitle: 'Gợi ý điều muốn nói.',
    icon: 'chatbubble-ellipses-outline',
    route: ROUTES.ai,
    mode: 'push',
  },
  {
    id: 'timeline',
    label: 'Dòng thời gian',
    subtitle: 'Những khoảnh khắc đang diễn ra.',
    icon: 'time-outline',
    route: ROUTES.timeline,
    mode: 'replace',
  },
  {
    id: 'dates',
    label: 'Lịch hẹn hò',
    subtitle: 'Lên lịch cho một buổi hẹn.',
    icon: 'calendar-outline',
    route: ROUTES.dates,
    mode: 'push',
  },
  {
    id: 'memory-book',
    label: 'Sổ kỉ niệm',
    subtitle: 'Cất giữ điều đáng nhớ.',
    icon: 'heart-outline',
    route: ROUTES.memoryBook,
    mode: 'push',
  },
  {
    id: 'missions',
    label: 'Nhiệm vụ',
    subtitle: 'Một việc nhỏ cho hai người.',
    icon: 'checkmark-circle-outline',
    route: ROUTES.missions,
    mode: 'replace',
  },
];
