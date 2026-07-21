import type {
  MemoryFilter,
  MemoryItem,
  RelationshipSummary,
} from '@/features/memories/types';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function toLocalCalendarDaySerial(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDateAtUtcMidnight(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(referenceDate: Date, days: number) {
  const result = new Date(
    toLocalCalendarDaySerial(referenceDate) + days * MILLISECONDS_PER_DAY,
  );
  return result.toISOString().slice(0, 10);
}

export function getDaysUntil(eventDate: string, referenceDate = new Date()) {
  return Math.round(
    (parseIsoDateAtUtcMidnight(eventDate) -
      toLocalCalendarDaySerial(referenceDate)) /
      MILLISECONDS_PER_DAY,
  );
}

export function formatMemoryDate(eventDate: string) {
  const [year, month, day] = eventDate.split('-');
  return `${day}/${month}/${year}`;
}

export function createRelationshipSummary(): RelationshipSummary {
  return {
    daysTogether: 500,
    countdownDays: 12,
    countdownHours: 8,
  };
}

export function createMemorySeed(referenceDate = new Date()): MemoryItem[] {
  return [
    {
      id: 'together-500',
      type: 'together',
      title: 'Kỉ niệm 500 ngày bên nhau',
      eventDate: addDays(referenceDate, 12),
      recurrence: 'none',
      coverAssetKey: 'together',
      note: 'Ngày chúng mình tiếp tục viết thêm một trang mới.',
      reminder: {
        enabled: true,
        leadDays: 3,
        time: '09:00',
        recipient: 'couple',
      },
    },
    {
      id: 'movie-date',
      type: 'special',
      title: 'Đi xem phim',
      eventDate: addDays(referenceDate, 27),
      recurrence: 'none',
      coverAssetKey: 'movie',
    },
    {
      id: 'holiday-trip',
      type: 'holiday',
      title: 'Đi du lịch',
      eventDate: addDays(referenceDate, 167),
      recurrence: 'none',
      coverAssetKey: 'trip',
    },
  ];
}

export function filterMemories(
  items: MemoryItem[],
  filter: MemoryFilter,
  referenceDate = new Date(),
) {
  return items.filter((item) => {
    const daysUntil = getDaysUntil(item.eventDate, referenceDate);
    const matchesStatus =
      filter.status === 'all' ||
      (filter.status === 'upcoming' && daysUntil >= 0) ||
      (filter.status === 'past' && daysUntil < 0);
    const matchesType = filter.type === 'all' || item.type === filter.type;
    const matchesRange =
      filter.range === 'all' ||
      (filter.range === 'next30' && daysUntil >= 0 && daysUntil <= 30) ||
      (filter.range === 'past' && daysUntil < 0);

    return matchesStatus && matchesType && matchesRange;
  });
}

export function addMemory(items: MemoryItem[], memory: MemoryItem) {
  return [...items, memory];
}

export function updateMemory(items: MemoryItem[], memory: MemoryItem) {
  return items.map((item) => (item.id === memory.id ? memory : item));
}

export function removeMemory(items: MemoryItem[], memoryId: string) {
  return items.filter((item) => item.id !== memoryId);
}

export async function getMemoryGallery(): Promise<MemoryItem[]> {
  return createMemorySeed();
}
