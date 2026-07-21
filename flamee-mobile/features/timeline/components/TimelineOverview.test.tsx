import { fireEvent, render } from '@testing-library/react-native';

import {
  createTimelineSeed,
  createRelationshipSummary,
} from '@/features/timeline/services/timelineService';

import { TimelineOverview } from './TimelineOverview';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));
jest.mock('expo-linear-gradient', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return { LinearGradient: View };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: View };
});

const referenceDate = new Date('2026-05-31T00:00:00.000Z');

describe('TimelineOverview', () => {
  it('renders the Figma overview and wires its actions', async () => {
    const onAdd = jest.fn();
    const onClearFilter = jest.fn();
    const onOpenFilter = jest.fn();
    const onOpenTimeline = jest.fn();
    const { getByRole, getByText } = await render(
      <TimelineOverview
        timeline={createTimelineSeed(referenceDate)}
        onAdd={onAdd}
        onClearFilter={onClearFilter}
        onOpenFilter={onOpenFilter}
        onOpenTimeline={onOpenTimeline}
        referenceDate={referenceDate}
        summary={createRelationshipSummary()}
      />,
    );

    expect(getByText('Dòng thời gian')).toBeTruthy();
    expect(getByText('500')).toBeTruthy();
    expect(getByText('Các cột mốc sắp đến')).toBeTruthy();
    expect(getByText('Kỉ niệm 500 ngày bên nhau')).toBeTruthy();

    await fireEvent.press(getByRole('button', { name: 'Lọc cột mốc' }));
    await fireEvent.press(getByRole('button', { name: 'Thêm cột mốc' }));
    await fireEvent.press(
      getByRole('button', {
        name: 'Mở Kỉ niệm 500 ngày bên nhau',
      }),
    );

    expect(onOpenFilter).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onOpenTimeline).toHaveBeenCalledWith('together-500');
  });

  it('renders the filtered empty state', async () => {
    const onClearFilter = jest.fn();
    const { getByRole, getByText } = await render(
      <TimelineOverview
        timeline={[]}
        onAdd={jest.fn()}
        onClearFilter={onClearFilter}
        onOpenFilter={jest.fn()}
        onOpenTimeline={jest.fn()}
        referenceDate={referenceDate}
        summary={createRelationshipSummary()}
      />,
    );

    expect(getByText('Chưa tìm thấy cột mốc')).toBeTruthy();
    await fireEvent.press(getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });

  it('allows long timeline titles to expand instead of clipping them', async () => {
    const longTitle =
      'Một cột mốc thật dài vẫn cần được đọc đầy đủ trên màn hình nhỏ';
    const timeline = {
      ...createTimelineSeed(referenceDate)[0]!,
      title: longTitle,
    };
    const { getByText } = await render(
      <TimelineOverview
        timeline={[timeline]}
        onAdd={jest.fn()}
        onClearFilter={jest.fn()}
        onOpenFilter={jest.fn()}
        onOpenTimeline={jest.fn()}
        referenceDate={referenceDate}
        summary={createRelationshipSummary()}
      />,
    );

    expect(getByText(longTitle).props.numberOfLines).toBeUndefined();
  });

  it('lays timeline cards out as the original vertical card list', async () => {
    const { getByTestId } = await render(
      <TimelineOverview
        timeline={createTimelineSeed(referenceDate)}
        onAdd={jest.fn()}
        onClearFilter={jest.fn()}
        onOpenFilter={jest.fn()}
        onOpenTimeline={jest.fn()}
        referenceDate={referenceDate}
        summary={createRelationshipSummary()}
      />,
    );

    expect(getByTestId('timeline-list').props.style).toEqual(
      expect.not.objectContaining({ flexDirection: 'row' }),
    );
  });
});
