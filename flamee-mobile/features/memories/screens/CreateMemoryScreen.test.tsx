import { fireEvent, render } from '@testing-library/react-native';

import type { MemoryReminderValues } from '@/features/memories/schemas/memorySchema';

import { CreateMemoryScreen } from './CreateMemoryScreen';

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

const disabledReminder: MemoryReminderValues = { enabled: false };

describe('CreateMemoryScreen', () => {
  it('renders all six types and emits the selected type on step one', async () => {
    const onSelectType = jest.fn();
    const { getByRole, getByText } = await render(
      <CreateMemoryScreen
        draft={{ recurrence: 'none' }}
        errors={{ type: 'Vui lòng chọn loại cột mốc' }}
        onBack={jest.fn()}
        onChangeDetails={jest.fn()}
        onChangeReminder={jest.fn()}
        onComplete={jest.fn()}
        onNext={jest.fn()}
        onSelectType={onSelectType}
        reminder={disabledReminder}
        step={1}
      />,
    );

    for (const label of [
      'Ngày bên nhau',
      'Sinh nhật',
      'Ngày kỉ niệm',
      'Ngày đặc biệt',
      'Ngày lễ',
      'Tự tạo',
    ]) {
      expect(getByRole('button', { name: label })).toBeTruthy();
    }
    expect(getByText('Vui lòng chọn loại cột mốc')).toBeTruthy();

    await fireEvent.press(getByRole('button', { name: 'Sinh nhật' }));
    expect(onSelectType).toHaveBeenCalledWith('birthday');
  });

  it('emits controlled details and renders validation on step two', async () => {
    const onChangeDetails = jest.fn();
    const { getByLabelText, getByText } = await render(
      <CreateMemoryScreen
        draft={{ type: 'special', recurrence: 'none' }}
        errors={{ title: 'Vui lòng nhập tên cột mốc' }}
        onBack={jest.fn()}
        onChangeDetails={onChangeDetails}
        onChangeReminder={jest.fn()}
        onComplete={jest.fn()}
        onNext={jest.fn()}
        onSelectType={jest.fn()}
        reminder={disabledReminder}
        step={2}
      />,
    );

    expect(getByText('Vui lòng nhập tên cột mốc')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('Tên cột mốc'), 'Buổi hẹn đầu');
    await fireEvent.changeText(getByLabelText('Ngày diễn ra'), '2026-08-20');

    expect(onChangeDetails).toHaveBeenCalledWith({ title: 'Buổi hẹn đầu' });
    expect(onChangeDetails).toHaveBeenCalledWith({ eventDate: '2026-08-20' });
  });

  it('emits reminder defaults and completes step three', async () => {
    const onChangeReminder = jest.fn();
    const onComplete = jest.fn();
    const { getByRole } = await render(
      <CreateMemoryScreen
        draft={{
          type: 'birthday',
          title: 'Sinh nhật',
          eventDate: '2026-07-01',
          recurrence: 'yearly',
        }}
        errors={{}}
        onBack={jest.fn()}
        onChangeDetails={jest.fn()}
        onChangeReminder={onChangeReminder}
        onComplete={onComplete}
        onNext={jest.fn()}
        onSelectType={jest.fn()}
        reminder={disabledReminder}
        step={3}
      />,
    );

    await fireEvent(
      getByRole('switch', { name: 'Bật nhắc nhở' }),
      'valueChange',
      true,
    );
    await fireEvent.press(getByRole('button', { name: 'Hoàn tất' }));

    expect(onChangeReminder).toHaveBeenCalledWith({
      enabled: true,
      leadDays: 3,
      time: '09:00',
      recipient: 'couple',
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it.each([1, 2, 3] as const)(
    'uses the supplied back behavior on step %s',
    async (step) => {
      const onBack = jest.fn();
      const { getByRole } = await render(
        <CreateMemoryScreen
          draft={{ recurrence: 'none' }}
          errors={{}}
          onBack={onBack}
          onChangeDetails={jest.fn()}
          onChangeReminder={jest.fn()}
          onComplete={jest.fn()}
          onNext={jest.fn()}
          onSelectType={jest.fn()}
          reminder={disabledReminder}
          step={step}
        />,
      );

      await fireEvent.press(
        getByRole('button', {
          name: step === 1 ? 'Hủy' : 'Quay lại',
        }),
      );
      expect(onBack).toHaveBeenCalledTimes(1);
    },
  );
});
