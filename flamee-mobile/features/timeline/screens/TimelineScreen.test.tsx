import { act, fireEvent, render } from '@testing-library/react-native';

import { TimelineScreen } from './TimelineScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));
jest.mock('expo-linear-gradient', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return { LinearGradient: View };
});
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('TimelineScreen', () => {
  it('applies filters in a full-screen workflow and clears empty results', async () => {
    const { getAllByText, getByRole, getByText } = await render(
      <TimelineScreen />,
    );

    expect(getByText('Dòng thời gian')).toBeTruthy();
    await fireEvent.press(getByRole('button', { name: 'Lọc cột mốc' }));
    expect(getAllByText('Bộ lọc')).toHaveLength(2);

    await fireEvent.press(
      getByRole('button', { name: 'Trạng thái: Đã qua' }),
    );
    await fireEvent.press(getByRole('button', { name: 'Áp dụng bộ lọc' }));
    expect(getByText('Chưa tìm thấy cột mốc')).toBeTruthy();

    await fireEvent.press(getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(getByText('Kỉ niệm 500 ngày bên nhau')).toBeTruthy();
  });

  it('creates, edits, and deletes a timeline through local state', async () => {
    const { getByLabelText, getByRole, getByText, queryByText } = await render(
      <TimelineScreen />,
    );

    await fireEvent.press(getByRole('button', { name: 'Thêm cột mốc' }));
    await fireEvent.press(getByRole('button', { name: 'Tự tạo' }));
    await fireEvent.press(getByRole('button', { name: 'Tiếp tục' }));
    await fireEvent.changeText(
      getByLabelText('Tên cột mốc'),
      'Chuyến đi của chúng mình',
    );
    await fireEvent.changeText(getByLabelText('Ngày diễn ra'), '2030-01-01');
    await fireEvent.press(getByRole('button', { name: 'Tiếp tục' }));
    await fireEvent.press(getByRole('button', { name: 'Hoàn tất' }));

    expect(getByText('Chuyến đi của chúng mình')).toBeTruthy();

    await fireEvent.press(
      getByRole('button', { name: 'Mở Chuyến đi của chúng mình' }),
    );
    await fireEvent.changeText(
      getByLabelText('Tên cột mốc'),
      'Chuyến đi Đà Lạt',
    );
    await fireEvent.press(getByRole('button', { name: 'Sửa' }));
    expect(getByText('Chuyến đi Đà Lạt')).toBeTruthy();

    await fireEvent.press(
      getByRole('button', { name: 'Mở Chuyến đi Đà Lạt' }),
    );
    await fireEvent.press(getByRole('button', { name: 'Xóa cột mốc' }));
    await fireEvent.press(getByRole('button', { name: 'Xác nhận xóa' }));
    expect(queryByText('Chuyến đi Đà Lạt')).toBeNull();
  });

  it('maps the system back action to each full-screen workflow', async () => {
    const { getByRole, getByTestId, queryByTestId } = await render(
      <TimelineScreen />,
    );

    await fireEvent.press(getByRole('button', { name: 'Lọc cột mốc' }));
    expect(getByTestId('timeline-filter-modal').props.visible).toBe(true);
    await act(async () => {
      getByTestId('timeline-filter-modal').props.onRequestClose();
    });
    expect(queryByTestId('timeline-filter-modal')).toBeNull();

    await fireEvent.press(getByRole('button', { name: 'Thêm cột mốc' }));
    await act(async () => {
      getByTestId('create-timeline-modal').props.onRequestClose();
    });
    expect(queryByTestId('create-timeline-modal')).toBeNull();

    await fireEvent.press(getByRole('button', { name: 'Thêm cột mốc' }));
    await fireEvent.press(getByRole('button', { name: 'Tự tạo' }));
    await fireEvent.press(getByRole('button', { name: 'Tiếp tục' }));
    await act(async () => {
      getByTestId('create-timeline-modal').props.onRequestClose();
    });
    expect(getByTestId('create-timeline-modal').props.visible).toBe(true);
    await act(async () => {
      getByTestId('create-timeline-modal').props.onRequestClose();
    });
    expect(queryByTestId('create-timeline-modal')).toBeNull();

    await fireEvent.press(
      getByRole('button', { name: 'Mở Kỉ niệm 500 ngày bên nhau' }),
    );
    expect(getByTestId('edit-timeline-modal').props.visible).toBe(true);
    await act(async () => {
      getByTestId('edit-timeline-modal').props.onRequestClose();
    });
    expect(queryByTestId('edit-timeline-modal')).toBeNull();
  });
});
