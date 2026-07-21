import type { MemoryBookEntry } from '@/features/memory-book/types';

export function createMemoryBookSeed(): MemoryBookEntry[] {
  return [
    { id: 'book-1', title: 'Kỉ niệm 500 ngày bên nhau', occurredOn: '2026-07-20', coverAssetKey: 'together', note: 'Một chặng đường thật dịu dàng.', location: 'Hà Nội' },
    { id: 'book-2', title: 'Sinh nhật của em', occurredOn: '2026-05-15', coverAssetKey: 'birthday', note: 'Bánh kem và những điều ước.' },
    { id: 'book-3', title: 'Chuyến đi biển đầu tiên', occurredOn: '2026-04-02', coverAssetKey: 'trip', note: 'Mình đã cười rất nhiều.' },
  ];
}

export const addMemoryBookEntry = (entries: MemoryBookEntry[], entry: MemoryBookEntry) => [...entries, entry];
export const updateMemoryBookEntry = (entries: MemoryBookEntry[], entry: MemoryBookEntry) => entries.map((item) => item.id === entry.id ? entry : item);
export const removeMemoryBookEntry = (entries: MemoryBookEntry[], id: string) => entries.filter((item) => item.id !== id);
