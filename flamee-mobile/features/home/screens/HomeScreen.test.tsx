import { fireEvent, render } from '@testing-library/react-native';

import { ROUTES } from '@/shared/lib/navigation/routes';

import { HomeScreen } from './HomeScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: View };
});

jest.mock('@/features/mascot', () => ({
  HomeMascotCompanion: () => {
    const { View } = require('react-native');
    return <View testID="home-mascot-companion" />;
  },
}));

jest.mock('../hooks/useHomeWelcome', () => ({
  useHomeWelcome: () => ({
    content: {
      greeting: 'Chào buổi sáng',
      quote: 'Tình yêu được nuôi dưỡng từ những kỷ niệm.',
    },
    greetingStyle: { opacity: 1, transform: [{ translateY: 0 }] },
    quoteStyle: { opacity: 1, transform: [{ translateY: 0 }] },
    shouldAnimate: false,
  }),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('composes the welcome-first home experience without removing the mascot or background', async () => {
    const screen = await render(<HomeScreen />);

    expect(screen.getByTestId('home-background')).toBeTruthy();
    expect(screen.getByTestId('home-welcome-header')).toBeTruthy();
    expect(screen.getByText('Chào buổi sáng')).toBeTruthy();
    expect(screen.getByTestId('home-bento-grid')).toBeTruthy();
    expect(screen.getByTestId('home-mascot-companion')).toBeTruthy();
  });

  it('keeps header and bento navigation semantics intact', async () => {
    const screen = await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Mở Chat AI' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Nhiệm vụ' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Lịch hẹn hò' }));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.ai);
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.missions);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.dates);
  });
});
