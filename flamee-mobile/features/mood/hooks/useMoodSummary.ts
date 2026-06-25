import { useQuery } from '@tanstack/react-query';

import { getMoodSummary } from '@/features/mood/services/moodService';

export function useMoodSummary() {
  return useQuery({
    queryKey: ['mood-summary'],
    queryFn: getMoodSummary,
  });
}
