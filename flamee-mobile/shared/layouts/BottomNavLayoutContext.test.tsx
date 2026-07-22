import { act, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { BottomNavLayoutProvider, useBottomNavLayout } from './BottomNavLayoutContext';

function LayoutReader() {
  const { frame, setFrame } = useBottomNavLayout();

  return (
    <>
      <Pressable
        testID="measure-bottom-nav"
        onLayout={({ nativeEvent }) => setFrame(nativeEvent.layout)}
      />
      <Text>{frame ? `${frame.y}:${frame.height}` : 'unmeasured'}</Text>
    </>
  );
}

describe('BottomNavLayoutProvider', () => {
  it('publishes the latest measured navigation frame to descendants', async () => {
    const screen = await render(
      <BottomNavLayoutProvider>
        <LayoutReader />
      </BottomNavLayoutProvider>,
    );

    await act(async () => {
      screen.getByTestId('measure-bottom-nav').props.onLayout({
        nativeEvent: { layout: { x: 0, y: 700, width: 402, height: 72 } },
      });
    });

    expect(screen.getByText('700:72')).toBeTruthy();
  });
});
