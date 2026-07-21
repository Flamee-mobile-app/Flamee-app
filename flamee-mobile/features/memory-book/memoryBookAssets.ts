import { timelineAssets } from '@/features/timeline/timelineAssets';

/**
 * Temporary curated covers for memory-book entries.
 *
 * The image files are Timeline-owned until the Memory Book receives its dedicated
 * illustration exports; components still depend on this feature-level registry.
 */
export const memoryBookAssets = {
  together: timelineAssets.together,
  birthday: timelineAssets.birthday,
  trip: timelineAssets.trip,
} as const;
