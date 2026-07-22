import { act, fireEvent, render } from '@testing-library/react-native';

import { ROUTES } from '@/shared/lib/navigation/routes';

import { BottomNav } from './BottomNav';

const mockReplace = jest.fn();
let mockPathname = '/home';

const primaryTabs = [
  { key: 'home', label: 'Trang chủ', pathname: '/home' },
  { key: 'timeline', label: 'Hoạt động', pathname: '/timeline' },
  { key: 'missions', label: 'Nhiệm vụ', pathname: '/missions' },
  { key: 'profile', label: 'Hồ sơ', pathname: '/profile' },
] as const;

const HOME_PATH_TEST_IDS = [
  'flamee-icon-home-roof',
  'flamee-icon-home-body',
  'flamee-icon-home-heart',
] as const;

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
    ['Hoạt động', ROUTES.timeline],
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

  it('marks Hoạt động as selected on the timeline route', async () => {
    mockPathname = '/timeline';
    const { getByRole } = await render(<BottomNav />);

    expect(
      getByRole('tab', { name: 'Hoạt động' }).props.accessibilityState,
    ).toEqual({ selected: true });
  });

  it.each([
    ['/home', true],
    ['/timeline', false],
  ] as const)('renders one Home icon filled=%s on %s', async (pathname, filled) => {
    mockPathname = pathname;
    const { getByTestId } = await render(<BottomNav />);

    expect(getByTestId('flamee-icon-home')).toBeTruthy();
    HOME_PATH_TEST_IDS.forEach((testID) => {
      const path = getByTestId(testID);

      if (filled) {
        expect(path.props.fill).not.toBeNull();
        expect(path.props.stroke).toBeFalsy();
      } else {
        expect(path.props.fill).toBeNull();
        expect(path.props.stroke).not.toBeNull();
      }
    });
  });

  it.each(primaryTabs)('visually activates only $label on $pathname', async ({ key, label, pathname }) => {
    mockPathname = pathname;
    const { getByRole, getByTestId } = await render(<BottomNav />);
    const inactive = primaryTabs.find((item) => item.key !== key)!;

    expect(getByTestId(`bottom-nav-visual-${key}`).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 1 })]),
    );
    expect(getByTestId(`bottom-nav-visual-${inactive.key}`).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.62 })]),
    );
    expect(getByRole('tab', { name: label }).props.accessibilityState).toEqual({ selected: true });
    expect(getByRole('tab', { name: inactive.label }).props.accessibilityState).toEqual({
      selected: false,
    });
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

  it.each([
    ['home', { left: 23, top: 15, width: 57 }],
    ['timeline', { left: 100, top: 15, width: 60 }],
    ['missions', { left: 242, top: 12, width: 55 }],
    ['profile', { left: 321, top: 12, width: 34 }],
  ] as const)('renders the %s visual at its Figma position', async (key, layout) => {
    const { getByTestId } = await render(<BottomNav />);

    expect(getByTestId(`bottom-nav-visual-${key}`).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(layout)]),
    );
    expect(getByTestId(`bottom-nav-button-${key}`).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(layout)]),
    );
  });
});
