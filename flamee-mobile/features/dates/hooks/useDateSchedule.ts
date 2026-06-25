import { useQuery } from '@tanstack/react-query';

import { getDateSchedule } from '@/features/dates/services/dateService';

export function useDateSchedule() {
  return useQuery({
    queryKey: ['date-schedule'],
    queryFn: getDateSchedule,
  });
}
