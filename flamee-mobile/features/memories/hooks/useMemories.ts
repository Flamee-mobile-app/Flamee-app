import { useQuery } from '@tanstack/react-query';

import { getMemoryGallery, getTimelineMemories } from '@/features/memories/services/memoryService';

export function useTimelineMemories() {
  return useQuery({
    queryKey: ['memories', 'timeline'],
    queryFn: getTimelineMemories,
  });
}

export function useMemoryGallery() {
  return useQuery({
    queryKey: ['memories', 'gallery'],
    queryFn: getMemoryGallery,
  });
}
