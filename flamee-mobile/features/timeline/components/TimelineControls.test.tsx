import { fireEvent, render } from '@testing-library/react-native';

import { timelineAssets } from '@/features/timeline/timelineAssets';

import { TimelineActionBar } from './TimelineActionBar';
import { TimelineChip } from './TimelineChip';
import { TimelineDetailsForm } from './TimelineDetailsForm';
import { TimelineEmptyState } from './TimelineEmptyState';
import { TimelineStepIndicator } from './TimelineStepIndicator';
import { TimelineTypeCard } from './TimelineTypeCard';

jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));

describe('timeline controls', () => {
  it('exposes chip selection and invokes its callback', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <TimelineChip label="Sắp tới" selected onPress={onPress} />,
    );
    const chip = getByRole('button', { name: 'Sắp tới' });

    expect(chip.props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('announces the current create step', async () => {
    const { getByRole } = await render(<TimelineStepIndicator currentStep={2} />);

    expect(getByRole('progressbar').props.accessibilityValue).toEqual({
      min: 1,
      max: 3,
      now: 2,
      text: 'Bước 2 trên 3',
    });
  });

  it('keeps type cards accessible and above the minimum touch target', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <TimelineTypeCard
        asset={timelineAssets.birthday}
        description="Ngày đặc biệt của hai đứa"
        label="Sinh nhật"
        onPress={onPress}
        selected
        width={140}
      />,
    );
    const card = getByRole('button', { name: 'Sinh nhật' });

    expect(card.props.accessibilityState).toEqual({ selected: true });
    expect(card.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ minHeight: 44 }),
        expect.objectContaining({ width: 140 }),
      ]),
    );
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('wires both shared action callbacks', async () => {
    const onBack = jest.fn();
    const onPrimary = jest.fn();
    const { getByRole } = await render(
      <TimelineActionBar
        backLabel="Quay lại"
        onBack={onBack}
        onPrimary={onPrimary}
        primaryLabel="Tiếp tục"
      />,
    );

    await fireEvent.press(getByRole('button', { name: 'Quay lại' }));
    await fireEvent.press(getByRole('button', { name: 'Tiếp tục' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('emits typed detail patches and renders field errors', async () => {
    const onChange = jest.fn();
    const { getByLabelText, getByRole, getByText } = await render(
      <TimelineDetailsForm
        draft={{ recurrence: 'none' }}
        errors={{
          title: 'Vui lòng nhập tên cột mốc',
          eventDate: 'Ngày diễn ra không hợp lệ',
        }}
        includeNote
        onChange={onChange}
      />,
    );

    const titleInput = getByLabelText('Tên cột mốc');
    const titleError = getByText('Vui lòng nhập tên cột mốc');
    expect(titleInput.props.accessibilityHint).toBe(
      'Vui lòng nhập tên cột mốc',
    );
    expect(titleInput.props['aria-invalid']).toBe(true);
    expect(titleInput.props['aria-describedby']).toBe(
      titleError.props.nativeID,
    );
    expect(titleError.props.accessibilityLiveRegion).toBe('polite');
    expect(getByText('Ngày diễn ra không hợp lệ')).toBeTruthy();
    await fireEvent.changeText(
      titleInput,
      'Ngày của chúng mình',
    );
    await fireEvent.changeText(getByLabelText('Ngày diễn ra'), '2026-08-20');
    await fireEvent.press(getByRole('button', { name: 'Hàng năm' }));

    expect(onChange).toHaveBeenCalledWith({ title: 'Ngày của chúng mình' });
    expect(onChange).toHaveBeenCalledWith({ eventDate: '2026-08-20' });
    expect(onChange).toHaveBeenCalledWith({ recurrence: 'yearly' });
  });

  it('offers a stable recovery action for empty filters', async () => {
    const onClear = jest.fn();
    const { getByRole } = await render(
      <TimelineEmptyState onClearFilter={onClear} />,
    );

    await fireEvent.press(getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
