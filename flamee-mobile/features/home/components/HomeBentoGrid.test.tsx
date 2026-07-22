import { fireEvent, render } from '@testing-library/react-native';

import { ROUTES } from '@/shared/lib/navigation/routes';

import { HomeBentoGrid } from './HomeBentoGrid';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

describe('HomeBentoGrid', () => {
  it('exposes every major Flamee function and uses its intended route mode', async () => {
    const onNavigate = jest.fn();
    const screen = await render(<HomeBentoGrid onNavigate={onNavigate} shouldAnimate={false} />);

    ['Mood check-in', 'Chat AI', 'Dòng thời gian', 'Lịch hẹn hò', 'Sổ kỉ niệm', 'Nhiệm vụ'].forEach(
      (label) => {
        expect(screen.getByRole('button', { name: label })).toBeTruthy();
      },
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Mood check-in' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Lịch hẹn hò' }));

    expect(onNavigate).toHaveBeenCalledWith(ROUTES.mood, 'replace');
    expect(onNavigate).toHaveBeenCalledWith(ROUTES.dates, 'push');
  });
});
