import { act, fireEvent, render } from '@testing-library/react-native';

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

  it.each([
    ['Trang chủ', ROUTES.home],
    ['Hoạt động', ROUTES.memories],
    ['Nhiệm vụ', ROUTES.missions],
    ['Hồ sơ', ROUTES.profile],
  ] as const)('replaces the route when %s is pressed', async (label, route) => {
    const { getByRole } = await render(<BottomNav />);

    fireEvent.press(getByRole('tab', { name: label }));

    expect(mockReplace).toHaveBeenCalledWith(route);
  });

  it('uses the inline SVG renderer at the Figma bar geometry', async () => {
    const { getByTestId } = await render(<BottomNav />);

    expect(getByTestId('bottom-nav-bar').props.style).toEqual(
      expect.objectContaining({ height: 72 }),
    );
    expect(getByTestId('bottom-nav-background-svg')).toBeTruthy();
    expect(getByTestId('bottom-nav-logo-svg')).toBeTruthy();
  });

  it('uses measured numeric Figma coordinates after the bar is laid out', async () => {
    const { getByRole, getByTestId } = await render(<BottomNav />);

    await act(async () => {
      getByTestId('bottom-nav-bar').props.onLayout({
        nativeEvent: { layout: { width: 201 } },
      });
    });

    expect(getByRole('tab', { name: 'Nhiệm vụ' }).props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ left: 121, top: 12, width: 27.5 }),
      ]),
    );
  });
});
