import { renderHook } from '@testing-library/react-native';
import { BackHandler, Platform } from 'react-native';

import { usePersistentMainBackGuard } from './usePersistentMainBackGuard';

jest.mock('expo-router', () => {
  const actualReact = jest.requireActual<typeof import('react')>('react');

  return {
    useFocusEffect: (effect: () => void | (() => void)) => actualReact.useEffect(effect, [effect]),
  };
});

describe('usePersistentMainBackGuard', () => {
  const remove = jest.fn();
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({ remove });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatformOS });
  });

  it.each(['/home', '/timeline', '/mood', '/missions', '/profile'])(
    'consumes Android system back while %s is focused',
    async (pathname) => {
      const { unmount } = await renderHook(() => usePersistentMainBackGuard(pathname));

      expect(BackHandler.addEventListener).toHaveBeenCalledTimes(1);
      expect(BackHandler.addEventListener).toHaveBeenCalledWith(
        'hardwareBackPress',
        expect.any(Function),
      );

      const handler = (BackHandler.addEventListener as jest.Mock).mock.calls[0][1];
      expect(handler()).toBe(true);

      await unmount();
      expect(remove).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['/ai', '/dates', '/memory-book'])(
    'leaves Android system back behavior unchanged on detail route %s',
    async (pathname) => {
      await renderHook(() => usePersistentMainBackGuard(pathname));

      expect(BackHandler.addEventListener).not.toHaveBeenCalled();
    },
  );

  it('does not install the native back guard outside Android', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    await renderHook(() => usePersistentMainBackGuard('/home'));

    expect(BackHandler.addEventListener).not.toHaveBeenCalled();
  });
});
