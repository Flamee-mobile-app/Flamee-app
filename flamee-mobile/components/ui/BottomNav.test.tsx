import { fireEvent, render } from '@testing-library/react-native';

import { ROUTES } from '@/lib/navigation/routes';

import { BottomNav } from './BottomNav';

const mockReplace = jest.fn();
let mockPathname = '/home';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { LinearGradient: View };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));

describe('BottomNav', () => {
  beforeEach(() => {
    mockPathname = '/home';
    mockReplace.mockClear();
  });

  it('renders only the four interactive tabs defined by Figma', async () => {
    const { getAllByRole, queryByRole } = await render(<BottomNav />);

    expect(getAllByRole('tab')).toHaveLength(4);
    expect(queryByRole('tab', { name: 'Mood' })).toBeNull();
    expect(queryByRole('tab', { name: 'Trang chủ' })).not.toBeNull();
    expect(queryByRole('tab', { name: 'Hoạt động' })).not.toBeNull();
    expect(queryByRole('tab', { name: 'Nhiệm vụ' })).not.toBeNull();
    expect(queryByRole('tab', { name: 'Hồ sơ' })).not.toBeNull();
  });

  it('replaces the route when the Hồ sơ tab is pressed', async () => {
    const { getByRole } = await render(<BottomNav />);

    fireEvent.press(getByRole('tab', { name: 'Hồ sơ' }));

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.profile);
  });

  it('uses the inline SVG renderer at the Figma bar geometry', async () => {
    const { getByTestId } = await render(<BottomNav />);

    expect(getByTestId('bottom-nav-bar').props.style).toEqual(
      expect.objectContaining({ height: 72 }),
    );
    expect(getByTestId('bottom-nav-background-svg')).toBeTruthy();
    expect(getByTestId('bottom-nav-logo-svg')).toBeTruthy();
  });
});
