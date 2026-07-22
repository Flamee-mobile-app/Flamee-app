import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { AuthGroupGuard } from './AuthGroupGuard';

const mockUseAuthStore = jest.fn();
let mockStatus: 'hydrating' | 'authenticated' | 'unauthenticated' = 'unauthenticated';

jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: { status: typeof mockStatus }) => unknown) =>
    mockUseAuthStore(selector),
}));

describe('AuthGroupGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation(
      (selector: (state: { status: typeof mockStatus }) => unknown) => selector({ status: mockStatus }),
    );
  });

  it('hides the main group while the user is unauthenticated', async () => {
    mockStatus = 'unauthenticated';

    const screen = await render(
      <AuthGroupGuard group="main">
        <Text>main content</Text>
      </AuthGroupGuard>,
    );

    expect(screen.queryByText('main content')).toBeNull();
  });

  it('hides the auth group while the user is authenticated', async () => {
    mockStatus = 'authenticated';

    const screen = await render(
      <AuthGroupGuard group="auth">
        <Text>auth content</Text>
      </AuthGroupGuard>,
    );

    expect(screen.queryByText('auth content')).toBeNull();
  });

  it('renders the authenticated main group', async () => {
    mockStatus = 'authenticated';

    const screen = await render(
      <AuthGroupGuard group="main">
        <Text>main content</Text>
      </AuthGroupGuard>,
    );

    expect(screen.getByText('main content')).toBeTruthy();
  });
});
