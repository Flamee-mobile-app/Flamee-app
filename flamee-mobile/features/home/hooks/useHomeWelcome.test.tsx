import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { resetHomeWelcomeSessionForTests } from '../lib/homeWelcomeSession';

import { useHomeWelcome } from './useHomeWelcome';

describe('useHomeWelcome', () => {
  const removeListener = jest.fn();

  beforeEach(() => {
    resetHomeWelcomeSessionForTests();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockReturnValue(
        { remove: removeListener } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>,
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    removeListener.mockClear();
    resetHomeWelcomeSessionForTests();
  });

  it('skips the welcome motion when the device requests reduced motion', async () => {
    const { result, unmount } = await renderHook(() => useHomeWelcome());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shouldAnimate).toBe(false);

    await unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });
});
