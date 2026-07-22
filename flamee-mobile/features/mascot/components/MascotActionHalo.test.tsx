import { act, fireEvent, render } from '@testing-library/react-native';

import type { MascotHaloLayout } from '../mascotLayout';
import type { MascotNudge } from '../types';

import { MascotActionHalo } from './MascotActionHalo';

const layout: MascotHaloLayout = {
  anchor: { right: 12, bottom: 100 },
  bubble: { width: 196, offsetX: -148, offsetY: -112 },
  actions: [
    { id: 'mood', offsetX: -48, offsetY: -58, labelSide: 'left' },
    { id: 'ai', offsetX: -70, offsetY: -14, labelSide: 'left' },
  ],
  mascotCenter: { x: 260, y: 492 },
};

const tiredNudge: MascotNudge = {
  id: 'mood:tired',
  mood: 'tired',
  message: 'Có vẻ hôm nay hơi dài. Một lời động viên dịu dàng có thể rất đúng lúc.',
  priority: 80,
  hasUnreadNudge: true,
  actions: [
    { id: 'mood', label: 'Mood check ngay', href: '/(main)/mood' },
    { id: 'ai', label: 'Nhắn AI cùng Flamee', href: '/(main)/ai' },
  ],
};

describe('MascotActionHalo', () => {
  it('exposes Mood Check and AI Chat from a compact message halo', async () => {
    const onAction = jest.fn();
    const screen = await render(
      <MascotActionHalo isExpanded layout={layout} nudge={tiredNudge} onAction={onAction} />,
    );

    expect(screen.getByText(tiredNudge.message)).toBeTruthy();
    expect(screen.getByTestId('mascot-halo-message').props.numberOfLines).toBe(3);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Mood check ngay' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Nhắn AI cùng Flamee' }));
    });

    expect(onAction).toHaveBeenNthCalledWith(1, tiredNudge.actions[0]);
    expect(onAction).toHaveBeenNthCalledWith(2, tiredNudge.actions[1]);
  });
});
