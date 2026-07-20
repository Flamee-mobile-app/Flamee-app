import { fireEvent, render } from '@testing-library/react-native';

import {
  createMemorySeed,
  createRelationshipSummary,
} from '@/features/memories/services/memoryService';

import { MemoriesOverview } from './MemoriesOverview';

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

describe('MemoriesOverview', () => {
  it('renders the Figma overview and wires its actions', async () => {
    const onAdd = jest.fn();
    const onClearFilter = jest.fn();
    const onOpenFilter = jest.fn();
    const onOpenMemory = jest.fn();
    const { getByRole, getByText } = await render(
      <MemoriesOverview
        memories={createMemorySeed(referenceDate)}
        onAdd={onAdd}
        onClearFilter={onClearFilter}
        onOpenFilter={onOpenFilter}
        onOpenMemory={onOpenMemory}
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
    expect(onOpenMemory).toHaveBeenCalledWith('together-500');
  });

  it('renders the filtered empty state', async () => {
    const onClearFilter = jest.fn();
    const { getByRole, getByText } = await render(
      <MemoriesOverview
        memories={[]}
        onAdd={jest.fn()}
        onClearFilter={onClearFilter}
        onOpenFilter={jest.fn()}
        onOpenMemory={jest.fn()}
        referenceDate={referenceDate}
        summary={createRelationshipSummary()}
      />,
    );

    expect(getByText('Chưa tìm thấy cột mốc')).toBeTruthy();
    await fireEvent.press(getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });
});
