import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDateSchedule,
  deleteDateSchedule,
  getDateSchedule,
  updateDateStatus,
} from '@/features/dates/services/dateService';
import type { CreateDatePayload, DateStatus } from '@/features/dates/types';

export function useDateSchedule() {
  return useQuery({
    queryKey: ['date-schedule'],
    queryFn: getDateSchedule,
  });
}

export function useCreateDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDatePayload) => createDateSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-schedule'] });
    },
  });
}

export function useUpdateDateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DateStatus }) =>
      updateDateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-schedule'] });
    },
  });
}

export function useDeleteDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDateSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-schedule'] });
    },
  });
}

