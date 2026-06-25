import { useQuery } from '@tanstack/react-query';

import { getHomeDashboard } from '@/features/home/services/homeService';

export function useHomeDashboard() {
  return useQuery({
    queryKey: ['home-dashboard'],
    queryFn: getHomeDashboard,
  });
}
