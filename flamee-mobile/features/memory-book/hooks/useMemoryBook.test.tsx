import { act, renderHook } from '@testing-library/react-native';
import { useMemoryBook } from '@/features/memory-book/hooks/useMemoryBook';

describe('useMemoryBook hook', () => {
  it('initializes with seed entries and overview view', async () => {
    const { result } = await renderHook(() => useMemoryBook());
    expect(result.current.view).toBe('overview');
    expect(result.current.entries.length).toBeGreaterThan(0);
  });

  it('navigates between views and manages draft', async () => {
    const { result } = await renderHook(() => useMemoryBook());

    await act(async () => {
      result.current.openCreate();
    });
    expect(result.current.view).toBe('create');

    await act(async () => {
      result.current.updateDraft({ title: 'Kỉ niệm đẹp', occurredOn: '2026-06-20' });
    });
    expect(result.current.draft.title).toBe('Kỉ niệm đẹp');

    await act(async () => {
      result.current.close();
    });
    expect(result.current.view).toBe('overview');
  });

  it('selects entry for detail view', async () => {
    const { result } = await renderHook(() => useMemoryBook());
    const firstId = result.current.entries[0].id;

    await act(async () => {
      result.current.openDetail(firstId);
    });
    expect(result.current.view).toBe('detail');
    expect(result.current.selectedEntry?.id).toBe(firstId);
  });
});

