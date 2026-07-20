import { fireEvent, render } from '@testing-library/react-native';

import { MemoryFilterScreen } from './MemoryFilterScreen';

jest.mock('react-native-safe-area-context', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});
jest.mock('expo-linear-gradient', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return { LinearGradient: View };
});

describe('MemoryFilterScreen', () => {
  it('renders controlled selections and emits filter patches', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <MemoryFilterScreen
        filter={{ status: 'upcoming', type: 'all', range: 'all' }}
        onApply={jest.fn()}
        onChange={onChange}
        onClear={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(
      getByRole('button', { name: 'Trạng thái: Sắp tới' }).props
        .accessibilityState,
    ).toEqual({ selected: true });

    await fireEvent.press(
      getByRole('button', { name: 'Trạng thái: Đã qua' }),
    );
    await fireEvent.press(
      getByRole('button', {
        name: 'Chọn loại cột mốc, hiện tại Tất cả',
      }),
    );
    await fireEvent.press(
      getByRole('button', { name: 'Loại cột mốc: Sinh nhật' }),
    );
    await fireEvent.press(
      getByRole('button', { name: 'Khoảng thời gian: 30 ngày tới' }),
    );

    expect(onChange).toHaveBeenCalledWith({ status: 'past' });
    expect(onChange).toHaveBeenCalledWith({ type: 'birthday' });
    expect(onChange).toHaveBeenCalledWith({ range: 'next30' });
  });

  it('closes, clears, and applies only through supplied callbacks', async () => {
    const onApply = jest.fn();
    const onClear = jest.fn();
    const onClose = jest.fn();
    const { getAllByText, getByRole } = await render(
      <MemoryFilterScreen
        filter={{ status: 'all', type: 'all', range: 'all' }}
        onApply={onApply}
        onChange={jest.fn()}
        onClear={onClear}
        onClose={onClose}
      />,
    );

    expect(getAllByText('Bộ lọc')).toHaveLength(2);
    await fireEvent.press(getByRole('button', { name: 'Đóng bộ lọc' }));
    await fireEvent.press(getByRole('button', { name: 'Đặt lại bộ lọc' }));
    await fireEvent.press(getByRole('button', { name: 'Áp dụng bộ lọc' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});
