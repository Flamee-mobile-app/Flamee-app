import { fireEvent, render } from '@testing-library/react-native';

import type { MemoryDraft } from '@/features/memories/types';

import { EditMemoryScreen } from './EditMemoryScreen';

jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));
jest.mock('expo-linear-gradient', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return { LinearGradient: View };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

const draft: MemoryDraft = {
  type: 'together',
  title: '500 ngày bên nhau',
  eventDate: '2026-06-12',
  recurrence: 'none',
  coverAssetKey: 'together',
  note: 'Ngày chúng mình chính thức bắt đầu hành trình yêu thương.',
};

describe('EditMemoryScreen', () => {
  it('renders prefilled fields and emits controlled save changes', async () => {
    const onChange = jest.fn();
    const onSave = jest.fn();
    const { getByLabelText, getByRole } = await render(
      <EditMemoryScreen
        deleteConfirmationVisible={false}
        draft={draft}
        errors={{}}
        onCancelDelete={jest.fn()}
        onChange={onChange}
        onClose={jest.fn()}
        onConfirmDelete={jest.fn()}
        onRequestDelete={jest.fn()}
        onSave={onSave}
      />,
    );

    expect(getByLabelText('Tên cột mốc').props.value).toBe(
      '500 ngày bên nhau',
    );
    expect(getByLabelText('Ngày diễn ra').props.value).toBe('2026-06-12');
    expect(getByLabelText('Ghi chú').props.value).toContain(
      'hành trình yêu thương',
    );

    await fireEvent.changeText(
      getByLabelText('Tên cột mốc'),
      '600 ngày bên nhau',
    );
    await fireEvent.press(getByRole('button', { name: 'Hàng năm' }));
    await fireEvent.press(getByRole('button', { name: 'Lưu thay đổi' }));

    expect(onChange).toHaveBeenCalledWith({ title: '600 ngày bên nhau' });
    expect(onChange).toHaveBeenCalledWith({ recurrence: 'yearly' });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('requests deletion without mutating data itself', async () => {
    const onRequestDelete = jest.fn();
    const onClose = jest.fn();
    const { getByRole } = await render(
      <EditMemoryScreen
        deleteConfirmationVisible={false}
        draft={draft}
        errors={{}}
        onCancelDelete={jest.fn()}
        onChange={jest.fn()}
        onClose={onClose}
        onConfirmDelete={jest.fn()}
        onRequestDelete={onRequestDelete}
        onSave={jest.fn()}
      />,
    );

    await fireEvent.press(getByRole('button', { name: 'Đóng chỉnh sửa' }));
    await fireEvent.press(getByRole('button', { name: 'Xóa cột mốc' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRequestDelete).toHaveBeenCalledTimes(1);
  });

  it('exposes both delete confirmation branches', async () => {
    const onCancelDelete = jest.fn();
    const onConfirmDelete = jest.fn();
    const { getByRole } = await render(
      <EditMemoryScreen
        deleteConfirmationVisible
        draft={draft}
        errors={{}}
        onCancelDelete={onCancelDelete}
        onChange={jest.fn()}
        onClose={jest.fn()}
        onConfirmDelete={onConfirmDelete}
        onRequestDelete={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    await fireEvent.press(getByRole('button', { name: 'Hủy xóa' }));
    await fireEvent.press(getByRole('button', { name: 'Xác nhận xóa' }));
    expect(onCancelDelete).toHaveBeenCalledTimes(1);
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });
});
