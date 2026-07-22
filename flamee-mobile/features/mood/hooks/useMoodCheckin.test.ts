import { act, renderHook } from '@testing-library/react-native';

import { useMoodCheckin } from './useMoodCheckin';
import type { MoodCheckinItem } from '../types';

describe('useMoodCheckin', () => {
  it('initializes with default selected index and option', async () => {
    const { result } = await renderHook(() => useMoodCheckin('happy'));

    expect(result.current.selectedIndex).toBeGreaterThanOrEqual(0);
    expect(result.current.selectedOption.label).toBe('Hạnh phúc');
    expect(result.current.note).toBe('');
    expect(result.current.isSubmitting).toBe(false);
  });

  it('navigates between mood options by index or option object', async () => {
    const { result } = await renderHook(() => useMoodCheckin('happy'));

    await act(async () => {
      result.current.selectMoodByIndex(2);
    });
    expect(result.current.selectedIndex).toBe(2);

    const calmOption = result.current.options.find((opt: MoodCheckinItem) => opt.mood === 'calm')!;
    await act(async () => {
      result.current.selectMoodOption(calmOption);
    });
    expect(result.current.selectedOption.mood).toBe('calm');
  });

  it('allows updating note text and resets state', async () => {
    const { result } = await renderHook(() => useMoodCheckin());

    await act(async () => {
      result.current.setNote('Hôm nay anh làm việc rất nhẹ nhàng');
    });
    expect(result.current.note).toBe('Hôm nay anh làm việc rất nhẹ nhàng');

    await act(async () => {
      result.current.reset();
    });
    expect(result.current.note).toBe('');
  });

  it('submits mood draft successfully', async () => {
    const { result } = await renderHook(() => useMoodCheckin());
    const onSuccess = jest.fn();

    await act(async () => {
      result.current.setNote('Một ngày vui vẻ bên nhau');
    });

    await act(async () => {
      await result.current.submit(onSuccess);
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.savedEntry).not.toBeNull();
    expect(result.current.savedEntry?.note).toBe('Một ngày vui vẻ bên nhau');
  });
});



