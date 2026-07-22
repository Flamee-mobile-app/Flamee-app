import { useQuery } from '@tanstack/react-query';
import { getMissions } from '@/features/missions/services/missionService';

export function useMissions() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: getMissions,
  });
}
