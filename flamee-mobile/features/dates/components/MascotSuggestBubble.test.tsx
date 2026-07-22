import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { MascotSuggestBubble } from './MascotSuggestBubble';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Medium: 'medium' },
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));
jest.mock('@/features/mascot/components/MascotArtwork', () => ({
  MascotArtwork: 'MascotArtwork',
}));

function renderBubble(onPressChat = jest.fn()) {
  return render(<MascotSuggestBubble onPressChat={onPressChat} />);
}

describe('MascotSuggestBubble', () => {
  it('keeps its collapsed chat badge anchored at the mascot upper-left corner', async () => {
    const screen = await renderBubble();

    expect(screen.getByTestId('mascot-suggest-collapsed-badge').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bottom: 48, position: 'absolute', right: 40, zIndex: 1 }),
      ]),
    );
  });

  it('opens from its mascot trigger and closes through the existing close button', async () => {
    const onPressChat = jest.fn();
    const screen = await renderBubble(onPressChat);

    await act(async () => {
      fireEvent.press(screen.getByTestId('mascot-suggest-trigger'));
    });
    expect(screen.getByTestId('mascot-suggest-expanded-bubble')).toBeTruthy();

    const closeButton = screen.getByRole('button', { name: 'Đóng gợi ý lịch hẹn hò' });
    expect(StyleSheet.flatten(closeButton.props.style)).toEqual(
      expect.objectContaining({ height: 44, width: 44 }),
    );

    await act(async () => {
      fireEvent.press(closeButton);
    });
    expect(screen.queryByTestId('mascot-message-dismiss-surface')).toBeNull();
    expect(onPressChat).not.toHaveBeenCalled();
  });

  it('closes when the user taps outside the message', async () => {
    const onPressChat = jest.fn();
    const screen = await renderBubble(onPressChat);

    await act(async () => {
      fireEvent.press(screen.getByTestId('mascot-suggest-trigger'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('mascot-message-dismiss-surface'));
    });

    expect(screen.queryByTestId('mascot-message-dismiss-surface')).toBeNull();
    expect(onPressChat).not.toHaveBeenCalled();
  });

  it('runs only the chat action when the message action is tapped', async () => {
    const onPressChat = jest.fn();
    const screen = await renderBubble(onPressChat);

    await act(async () => {
      fireEvent.press(screen.getByTestId('mascot-suggest-trigger'));
    });
    fireEvent.press(screen.getByTestId('mascot-suggest-chat-action'));

    expect(onPressChat).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mascot-message-dismiss-surface')).toBeTruthy();
  });
});
