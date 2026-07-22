import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { ROUTES } from '@/shared/lib/navigation/routes';

import { AuthGate, getAuthRedirect } from './AuthGate';

const mockReplace = jest.fn();
const mockUseAuthStore = jest.fn();
let mockSegments: string[] = [];
let mockRootNavigationState: { key: string } | undefined = { key: 'root-navigation' };
let mockStatus: 'hydrating' | 'authenticated' | 'unauthenticated' = 'unauthenticated';

jest.mock('expo-router', () => ({
  useRootNavigationState: () => mockRootNavigationState,
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockSegments,
}));

jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: { status: typeof mockStatus }) => unknown) =>
    mockUseAuthStore(selector),
}));

describe('AuthGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSegments = [];
    mockRootNavigationState = { key: 'root-navigation' };
    mockStatus = 'unauthenticated';
    mockUseAuthStore.mockImplementation(
      (selector: (state: { status: typeof mockStatus }) => unknown) => selector({ status: mockStatus }),
    );
  });

  it('selects Home for authenticated auth routes', () => {
    expect(getAuthRedirect('authenticated', ['(auth)', 'login'])).toBe(ROUTES.home);
  });

  it('selects Login for unauthenticated main routes', () => {
    expect(getAuthRedirect('unauthenticated', ['(main)', 'dates'])).toBe(ROUTES.login);
  });

  it('does not redirect an unauthenticated user away from the Start route', () => {
    expect(getAuthRedirect('unauthenticated', [])).toBeNull();
  });

  it('does not replace until the root navigator is available', async () => {
    mockStatus = 'authenticated';
    mockSegments = ['(auth)', 'login'];
    mockRootNavigationState = undefined;

    const screen = await render(
      <AuthGate>
        <Text>root stack</Text>
      </AuthGate>,
    );

    expect(screen.getByText('root stack')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('replaces auth history with Home for an authenticated session', async () => {
    mockStatus = 'authenticated';
    mockSegments = ['(auth)', 'login'];

    await render(
      <AuthGate>
        <Text>root stack</Text>
      </AuthGate>,
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(ROUTES.home));
  });
});
