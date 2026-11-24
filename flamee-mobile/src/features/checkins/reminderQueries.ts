import { infiniteQueryOptions, useQuery } from "@tanstack/react-query";
import { moodService, reminderKey, type ReminderScope } from "./moodService";

export function reminderOptions(scope: ReminderScope) {
  return infiniteQueryOptions({
    queryKey: [...reminderKey(scope), "pages"],
    queryFn: ({ pageParam, signal }) => moodService.reminders(scope, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last, _pages, offset) => last.items.length && offset + last.items.length < last.total ? offset + last.items.length : undefined,
    staleTime: 15_000, retry: false,
  });
}

export function useMoodReminderCapability(scope: ReminderScope) {
  return useQuery({ queryKey: [...reminderKey(scope), "capabilities"], queryFn: () => moodService.capabilities(scope), enabled: Boolean(scope.accountId), staleTime: 60_000, retry: false });
}
