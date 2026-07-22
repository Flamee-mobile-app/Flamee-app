import { act, renderHook } from '@testing-library/react-native';

import type { MoodSummary } from '@/features/mood/types';
import { ROUTES } from '@/shared/lib/navigation/routes';

import { useMascotCompanion } from './useMascotCompanion';

const mockPush = jest.fn();
const mockUseMoodSummary = jest.fn();

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

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/features/mood/hooks/useMoodSummary', () => ({
  useMoodSummary: () => mockUseMoodSummary(),
}));

describe('useMascotCompanion', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseMoodSummary.mockReturnValue({ data: tiredMoodSummary });
  });

  it('keeps the unread badge hidden after dismissal until a different nudge arrives', async () => {
    const { result } = await renderHook(() => useMascotCompanion());

    expect(result.current.nudge?.hasUnreadNudge).toBe(true);

    await act(async () => {
      result.current.dismiss();
    });
    expect(result.current.nudge?.hasUnreadNudge).toBe(false);
  });

  it('navigates only through the typed action href after completing a CTA', async () => {
    const { result } = await renderHook(() => useMascotCompanion());

    await act(async () => {
      result.current.complete(result.current.nudge!.actions[0]);
    });

    expect(mockPush).toHaveBeenCalledWith(ROUTES.mood);
  });
});
