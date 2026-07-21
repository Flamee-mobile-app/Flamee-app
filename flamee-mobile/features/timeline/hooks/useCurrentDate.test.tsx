import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import {
  getMillisecondsUntilNextLocalDay,
  useCurrentDate,
} from './useCurrentDate';

describe('useCurrentDate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('schedules the next refresh at local midnight', () => {
    const referenceDate = new Date(2026, 4, 31, 23, 59, 30, 0);

    expect(getMillisecondsUntilNextLocalDay(referenceDate)).toBe(30_000);
  });

  it('refreshes the reference date when the app becomes active', async () => {
    const initialDate = new Date(2026, 4, 31, 23, 55);
    const focusedDate = new Date(2026, 5, 1, 0, 5);
    const now = jest.fn(() => initialDate);
    const remove = jest.fn();
    let onAppStateChange: ((state: AppStateStatus) => void) | undefined;

    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        onAppStateChange = listener;
        return { remove };
      });

    const { result, unmount } = await renderHook(() => useCurrentDate(now));
    now.mockReturnValue(focusedDate);

    await act(async () => {
      onAppStateChange?.('active');
    });

    expect(result.current).toBe(focusedDate);
    await unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
