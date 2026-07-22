import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { useMoodSummary } from '@/features/mood/hooks/useMoodSummary';

import { createMoodMascotSignal, resolveMascotNudge } from '../services/mascotNudgeResolver';
import type { MascotAction } from '../types';

export function useMascotCompanion() {
  const router = useRouter();
  const { data: moodSummary } = useMoodSummary();
  const [dismissedNudgeId, setDismissedNudgeId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const resolvedNudge = useMemo(
    () => (moodSummary ? resolveMascotNudge([createMoodMascotSignal(moodSummary)]) : null),
    [moodSummary],
  );

  const nudge = useMemo(() => {
    if (!resolvedNudge || resolvedNudge.id !== dismissedNudgeId) {
      return resolvedNudge;
    }

    return { ...resolvedNudge, hasUnreadNudge: false };
  }, [dismissedNudgeId, resolvedNudge]);

  const open = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const dismiss = useCallback(() => {
    if (resolvedNudge) {
      setDismissedNudgeId(resolvedNudge.id);
    }
    setIsExpanded(false);
  }, [resolvedNudge]);

  const complete = useCallback(
    (action: MascotAction) => {
      if (resolvedNudge) {
        setDismissedNudgeId(resolvedNudge.id);
      }
      setIsExpanded(false);
      router.push(action.href);
    },
    [resolvedNudge, router],
  );

  return {
    isExpanded,
    nudge,
    open,
    dismiss,
    complete,
  };
}
