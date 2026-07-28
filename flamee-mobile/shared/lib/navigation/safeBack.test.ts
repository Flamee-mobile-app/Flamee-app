import { renderHook } from '@testing-library/react-native';
import { handleSafeBack, useSafeBack } from './safeBack';
import { ROUTES } from './routes';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

describe('handleSafeBack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls router.back when router.canGoBack returns true', () => {
    mockCanGoBack.mockReturnValue(true);
    const router = { canGoBack: mockCanGoBack, back: mockBack, replace: mockReplace };

    handleSafeBack(router);

    expect(mockCanGoBack).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('calls router.replace with default fallback (home) when router.canGoBack returns false', () => {
    mockCanGoBack.mockReturnValue(false);
    const router = { canGoBack: mockCanGoBack, back: mockBack, replace: mockReplace };

    handleSafeBack(router);

    expect(mockCanGoBack).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.home);
  });

  it('calls router.replace with custom fallback when provided', () => {
    mockCanGoBack.mockReturnValue(false);
    const router = { canGoBack: mockCanGoBack, back: mockBack, replace: mockReplace };

    handleSafeBack(router, ROUTES.timeline);

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.timeline);
  });
});

describe('useSafeBack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers router.back when canGoBack is true', async () => {
    mockCanGoBack.mockReturnValue(true);
    const { result } = await renderHook(() => useSafeBack());

    result.current();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('triggers router.replace with fallback when canGoBack is false', async () => {
    mockCanGoBack.mockReturnValue(false);
    const { result } = await renderHook(() => useSafeBack());

    result.current();

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.home);
  });
});
