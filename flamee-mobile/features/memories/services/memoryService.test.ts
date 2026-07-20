import type { MemoryFilter, MemoryItem } from '@/features/memories/types';

import {
  addMemory,
  createMemorySeed,
  createRelationshipSummary,
  filterMemories,
  formatMemoryDate,
  getDaysUntil,
  removeMemory,
  updateMemory,
} from './memoryService';

const referenceDate = new Date('2026-05-31T00:00:00.000Z');

const items: MemoryItem[] = [
  {
    id: 'together-500',
    type: 'together',
    title: 'Kỉ niệm 500 ngày bên nhau',
    eventDate: '2026-06-12',
    recurrence: 'none',
    coverAssetKey: 'together',
  },
  {
    id: 'movie',
    type: 'special',
    title: 'Đi xem phim',
    eventDate: '2026-06-27',
    recurrence: 'none',
    coverAssetKey: 'movie',
  },
  {
    id: 'first-date',
    type: 'anniversary',
    title: 'Buổi hẹn đầu tiên',
    eventDate: '2026-05-01',
    recurrence: 'yearly',
    coverAssetKey: 'anniversary',
  },
];

const allFilter: MemoryFilter = {
  status: 'all',
  type: 'all',
  range: 'all',
};

describe('memory date helpers', () => {
  it('calculates future, current, and past day offsets at UTC midnight', () => {
    expect(getDaysUntil('2026-06-12', referenceDate)).toBe(12);
    expect(getDaysUntil('2026-05-31', referenceDate)).toBe(0);
    expect(getDaysUntil('2026-05-01', referenceDate)).toBe(-30);
  });

  it('formats ISO calendar dates for Vietnamese display', () => {
    expect(formatMemoryDate('2026-06-12')).toBe('12/06/2026');
  });
});

describe('memory filtering', () => {
  it('combines status, type, and range filters', () => {
    expect(
      filterMemories(
        items,
        { status: 'upcoming', type: 'all', range: 'next30' },
        referenceDate,
      ),
    ).toHaveLength(2);

    expect(
      filterMemories(
        items,
        { status: 'all', type: 'anniversary', range: 'past' },
        referenceDate,
      ),
    ).toEqual([items[2]]);
  });

  it('returns the original ordering when every filter is all', () => {
    expect(filterMemories(items, allFilter, referenceDate)).toEqual(items);
  });
});

describe('immutable memory operations', () => {
  it('adds without mutating the original list', () => {
    const newItem: MemoryItem = {
      id: 'birthday',
      type: 'birthday',
      title: 'Sinh nhật',
      eventDate: '2026-07-01',
      recurrence: 'yearly',
    };

    expect(addMemory(items, newItem)).toEqual([...items, newItem]);
    expect(items).toHaveLength(3);
  });

  it('updates only the matching memory', () => {
    const updatedItem = { ...items[1], title: 'Xem phim cùng nhau' };
    const result = updateMemory(items, updatedItem);

    expect(result[1]).toEqual(updatedItem);
    expect(result[0]).toBe(items[0]);
    expect(result).not.toBe(items);
  });

  it('removes only the requested memory', () => {
    const result = removeMemory(items, 'movie');

    expect(result.map((item) => item.id)).toEqual(['together-500', 'first-date']);
    expect(items).toHaveLength(3);
  });
});

describe('deterministic mock data', () => {
  it('creates Figma-aligned countdown data from an injected date', () => {
    const seed = createMemorySeed(referenceDate);

    expect(seed.map((item) => getDaysUntil(item.eventDate, referenceDate))).toEqual([
      12,
      27,
      167,
    ]);
    expect(createRelationshipSummary()).toEqual({
      daysTogether: 500,
      countdownDays: 12,
      countdownHours: 8,
    });
  });
});
