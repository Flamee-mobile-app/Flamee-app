import { fireEvent, render } from '@testing-library/react-native';

import { MascotMessageDismissLayer } from './MascotMessageDismissLayer';

describe('MascotMessageDismissLayer', () => {
  it('exposes an accessible full-screen press target that dismisses the message', async () => {
    const onDismiss = jest.fn();
    const screen = await render(
      <MascotMessageDismissLayer onDismiss={onDismiss} testID="outside-dismiss" />,
    );

    expect(screen.getByRole('button', { name: 'Đóng gợi ý Flamee' })).toBeTruthy();

    fireEvent.press(screen.getByTestId('outside-dismiss'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
