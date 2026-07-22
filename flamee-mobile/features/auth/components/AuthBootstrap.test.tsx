import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AuthBootstrap } from './AuthBootstrap';

const mockHydrate = jest.fn();
const mockUseAuthStore = jest.fn();
let mockStatus: 'hydrating' | 'authenticated' | 'unauthenticated' = 'hydrating';

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
}));

const mockHideAsync = SplashScreen.hideAsync as jest.MockedFunction<typeof SplashScreen.hideAsync>;

jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: { hydrate: typeof mockHydrate; status: typeof mockStatus }) => unknown) =>
    mockUseAuthStore(selector),
}));

describe('AuthBootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStatus = 'hydrating';
    mockHydrate.mockResolvedValue(undefined);
    mockUseAuthStore.mockImplementation(
      (selector: (state: { hydrate: typeof mockHydrate; status: typeof mockStatus }) => unknown) =>
        selector({ hydrate: mockHydrate, status: mockStatus }),
    );
  });

  it('starts session hydration and keeps route content behind the splash while hydrating', async () => {
    const screen = await render(
      <AuthBootstrap>
        <Text>root stack</Text>
      </AuthBootstrap>,
    );

    await waitFor(() => expect(mockHydrate).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('root stack')).toBeNull();
    expect(mockHideAsync).not.toHaveBeenCalled();
  });

  it('reveals route content and hides the splash after hydration', async () => {
    const screen = await render(
      <AuthBootstrap>
        <Text>root stack</Text>
      </AuthBootstrap>,
    );

    mockStatus = 'unauthenticated';
    screen.rerender(
      <AuthBootstrap>
        <Text>root stack</Text>
      </AuthBootstrap>,
    );

    await waitFor(() => expect(mockHideAsync).toHaveBeenCalledTimes(1));
    expect(screen.getByText('root stack')).toBeTruthy();
  });
});
