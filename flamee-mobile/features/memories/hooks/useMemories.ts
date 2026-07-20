import { useQuery } from '@tanstack/react-query';

import { getMemoryGallery } from '@/features/memories/services/memoryService';

export function useMemoryGallery() {
  return useQuery({
    queryKey: ['memories', 'gallery'],
    queryFn: getMemoryGallery,
  });
}
