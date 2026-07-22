import { render } from '@testing-library/react-native';

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

describe('MascotSuggestBubble', () => {
  it('anchors its collapsed chat badge at the mascot upper-left corner', async () => {
    const screen = await render(<MascotSuggestBubble onPressChat={jest.fn()} />);

    expect(screen.getByTestId('mascot-suggest-collapsed-badge').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bottom: 48, position: 'absolute', right: 40, zIndex: 1 }),
      ]),
    );
  });
});
