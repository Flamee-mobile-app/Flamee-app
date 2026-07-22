import { act, fireEvent, render } from '@testing-library/react-native';

import { ROUTES } from '@/shared/lib/navigation/routes';

import { ProfileScreen } from './ProfileScreen';

const mockReplace = jest.fn();
const mockClearSession = jest.fn();
const mockUseProfileData = jest.fn();

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: { clearSession: typeof mockClearSession }) => unknown) =>
    selector({ clearSession: mockClearSession }),
}));

jest.mock('@/features/profile/hooks/useProfileData', () => ({
  useProfileData: () => mockUseProfileData(),
}));

describe('ProfileScreen logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfileData.mockReturnValue({
      data: { id: 'profile' },
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  it('clears the session before replacing Profile with Login', async () => {
    const events: string[] = [];
    mockClearSession.mockImplementation(async () => events.push('clear'));
    mockReplace.mockImplementation(() => events.push('replace'));
    const screen = await render(<ProfileScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Đăng xuất' }));
    });

    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.login);
    expect(events).toEqual(['clear', 'replace']);
  });
});
