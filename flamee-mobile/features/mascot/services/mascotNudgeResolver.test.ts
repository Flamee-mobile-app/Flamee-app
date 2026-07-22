import type { MoodSummary } from '@/features/mood/types';
import { ROUTES } from '@/shared/lib/navigation/routes';

import { createMoodMascotSignal, resolveMascotNudge } from './mascotNudgeResolver';

const tiredMoodSummary: MoodSummary = {
  partnerName: 'Bình',
  partnerMood: {
    id: 'tired',
    label: 'Hơi mệt',
    description: 'Cần nghỉ ngơi hoặc một lời động viên.',
    color: '#F7F7F7',
  },
  options: [],
  historyLabels: [],
};

describe('resolveMascotNudge', () => {
  it('selects the single highest-priority confident signal', () => {
    expect(
      resolveMascotNudge([
        { id: 'calm', source: 'mood', mood: 'calm', confidence: 0.9, priority: 10 },
        { id: 'care', source: 'mood', mood: 'tired', confidence: 0.9, priority: 80 },
      ]),
    ).toMatchObject({ id: 'care', mood: 'tired', hasUnreadNudge: true });
  });

  it('does not turn a low-confidence signal into an attention badge', () => {
    expect(
      resolveMascotNudge([
        { id: 'uncertain', source: 'mood', mood: 'sad', confidence: 0.4, priority: 90 },
      ]),
    ).toBeNull();
  });

  it('maps Mood Summary data to conditional actions instead of raw URLs', () => {
    const nudge = resolveMascotNudge([createMoodMascotSignal(tiredMoodSummary)]);

    expect(nudge?.actions.map((action) => action.href)).toEqual([ROUTES.mood, ROUTES.ai]);
    expect(nudge?.message).toMatch(/có vẻ/i);
  });
});
