import { act, fireEvent, render } from '@testing-library/react-native';
import { useEffect } from 'react';

import type { MoodSummary } from '@/features/mood/types';
import { BottomNavLayoutProvider, useBottomNavLayout } from '@/shared/layouts';

import { HomeMascotCompanion } from './HomeMascotCompanion';

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
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/features/mood/hooks/useMoodSummary', () => ({
  useMoodSummary: () => mockUseMoodSummary(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 34, left: 0, right: 0, top: 44 }),
}));

jest.mock(
  './MascotVisual',
  () => ({
    MascotVisual: 'MascotVisual',
  }),
  { virtual: true },
);

function BottomNavMeasurement() {
  const { setFrame } = useBottomNavLayout();
  useEffect(() => {
    setFrame({ x: 0, y: 700, width: 402, height: 72 });
  }, [setFrame]);
  return null;
}

describe('HomeMascotCompanion', () => {
  beforeEach(() => {
    mockUseMoodSummary.mockReturnValue({ data: tiredMoodSummary });
  });

  it('opens its suggestion from an accessible mascot button', async () => {
    const screen = await render(
      <BottomNavLayoutProvider>
        <HomeMascotCompanion />
      </BottomNavLayoutProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Flamee có một gợi ý mới' }));
    });

    expect(screen.getByText(/Có vẻ hôm nay hơi dài/)).toBeTruthy();
  });

  it('opens the halo and closes it from its transparent outside surface', async () => {
    const screen = await render(
      <BottomNavLayoutProvider>
        <HomeMascotCompanion />
      </BottomNavLayoutProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Flamee có một gợi ý mới' }));
    });

    expect(screen.getByTestId('mascot-action-halo')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('mascot-halo-dismiss-surface'));
    });

    expect(screen.queryByTestId('mascot-action-halo')).toBeNull();
  });

  it('anchors the mascot above the measured Bottom Navigation', async () => {
    const screen = await render(
      <BottomNavLayoutProvider>
        <BottomNavMeasurement />
        <HomeMascotCompanion />
      </BottomNavLayoutProvider>,
    );

    expect(screen.getByTestId('home-mascot-anchor').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ bottom: expect.any(Number) })]),
    );
  });
});
