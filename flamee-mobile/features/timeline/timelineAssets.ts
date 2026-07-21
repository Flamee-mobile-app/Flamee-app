import type { ImageSourcePropType } from 'react-native';

import type { TimelineType } from '@/features/timeline/types';

/** Static artwork owned by the Timeline feature. */
export const timelineAssets = {
  hero: require('../../assets/images/timeline/relationship-hero.webp'),
  together: require('../../assets/images/timeline/timeline-together.webp'),
  birthday: require('../../assets/images/timeline/timeline-birthday.webp'),
  anniversary: require('../../assets/images/timeline/timeline-anniversary.webp'),
  special: require('../../assets/images/timeline/timeline-special.webp'),
  holiday: require('../../assets/images/timeline/timeline-holiday.webp'),
  custom: require('../../assets/images/timeline/timeline-custom.webp'),
  movie: require('../../assets/images/timeline/timeline-movie.webp'),
  trip: require('../../assets/images/timeline/timeline-trip.webp'),
} as const satisfies Record<string, ImageSourcePropType>;

const timelineArtwork = {
  together: timelineAssets.together,
  birthday: timelineAssets.birthday,
  anniversary: timelineAssets.anniversary,
  special: timelineAssets.special,
  holiday: timelineAssets.holiday,
  custom: timelineAssets.custom,
  movie: timelineAssets.movie,
  trip: timelineAssets.trip,
} as const satisfies Record<string, ImageSourcePropType>;

export function getTimelineArtwork(
  coverAssetKey: string | undefined,
  type: TimelineType,
): ImageSourcePropType {
  if (coverAssetKey && coverAssetKey in timelineArtwork) {
    return timelineArtwork[coverAssetKey as keyof typeof timelineArtwork];
  }

  return timelineArtwork[type];
}
