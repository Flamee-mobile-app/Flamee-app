import { render } from '@testing-library/react-native';

import { MascotVisual } from './MascotVisual';

describe('MascotVisual', () => {
  it('renders a compact mascot with a semantic unread-message badge and aura glow', async () => {
    const screen = await render(
      <MascotVisual hasUnreadNudge isExpanded={false} mood="tired" reduceMotion />,
    );

    expect(screen.getByTestId('mascot-visual')).toBeTruthy();
    expect(screen.getByTestId('mascot-aura-glow')).toBeTruthy();
    expect(screen.getByLabelText('Có gợi ý mới')).toBeTruthy();
  });

  it('renders with press feedback active without error', async () => {
    const screen = await render(
      <MascotVisual hasUnreadNudge={false} isExpanded={false} isPressed mood="angry" reduceMotion />,
    );

    expect(screen.getByTestId('mascot-visual')).toBeTruthy();
    expect(screen.getByTestId('mascot-aura-glow')).toBeTruthy();
  });

  it('does not render the attention badge when there is no unseen nudge', async () => {
    const screen = await render(
      <MascotVisual hasUnreadNudge={false} isExpanded={false} mood="calm" reduceMotion />,
    );

    expect(screen.queryByLabelText('Có gợi ý mới')).toBeNull();
  });
});

