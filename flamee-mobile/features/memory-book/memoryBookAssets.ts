import type { ImageSourcePropType } from 'react-native';
import { timelineAssets } from '@/features/timeline/timelineAssets';

export const memoryBookAssets = {
  together: timelineAssets.together,
  birthday: timelineAssets.birthday,
  trip: timelineAssets.trip,
  special: timelineAssets.special,
  anniversary: timelineAssets.anniversary,
  holiday: timelineAssets.holiday,
  custom: timelineAssets.custom,
  movie: timelineAssets.movie,
  hero: timelineAssets.hero,
} as const satisfies Record<string, ImageSourcePropType>;

export function getMemoryBookCover(key?: string): ImageSourcePropType {
  if (key && key in memoryBookAssets) {
    return memoryBookAssets[key as keyof typeof memoryBookAssets];
  }
  return memoryBookAssets.together;
}

