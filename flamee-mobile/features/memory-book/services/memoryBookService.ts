import type { MemoryBookEntry } from '@/features/memory-book/types';

export function createMemoryBookSeed(): MemoryBookEntry[] {
  return [
    {
      id: 'book-1',
      title: '500 ngày bên nhau',
      occurredOn: '2026-06-12',
      coverAssetKey: 'hero',
      note: '500 ngày không quá dài, nhưng đủ để chúng mình hiểu, thương và đồng hành cùng nhau mỗi ngày.',
      location: 'Thành phố Hồ Chí Minh',
      category: 'Đặc biệt',
      tags: ['Kỉ niệm', 'Yêu thương', 'Hạnh phúc'],
      photos: ['hero', 'together', 'trip', 'special', 'anniversary', 'birthday'],
    },
    {
      id: 'book-2',
      title: 'Chuyến đi biển',
      occurredOn: '2026-06-20',
      coverAssetKey: 'trip',
      note: 'Sóng biển rì rào và nắng ấm.',
      location: 'Nha Trang',
      category: 'Chuyến đi',
      tags: ['Chuyến đi', 'Kỉ niệm'],
      photos: ['trip', 'together', 'hero'],
    },
    {
      id: 'book-3',
      title: 'Chuyến đi Đà Lạt',
      occurredOn: '2026-06-20',
      coverAssetKey: 'holiday',
      note: 'Đêm se lạnh bên lò sưởi ấm áp.',
      location: 'Đà Lạt',
      category: 'Chuyến đi',
      tags: ['Chuyến đi', 'Yêu thương'],
      photos: ['holiday', 'trip', 'hero'],
    },
    {
      id: 'book-4',
      title: 'Ngắm hoàng hôn',
      occurredOn: '2026-06-20',
      coverAssetKey: 'together',
      note: 'Bầu trời rực rỡ sắc cam hồng.',
      location: 'Phú Quốc',
      category: 'Đặc biệt',
      tags: ['Hạnh phúc'],
      photos: ['together', 'hero', 'special'],
    },
    {
      id: 'book-5',
      title: 'Quán cà phê quen',
      occurredOn: '2026-06-20',
      coverAssetKey: 'movie',
      note: 'Góc sân nhỏ đầy mảng xanh yên bình.',
      location: 'Sài Gòn',
      category: 'Đặc biệt',
      tags: ['Kỉ niệm'],
      photos: ['movie', 'together'],
    },
    {
      id: 'book-6',
      title: 'Ngắm sương mù',
      occurredOn: '2026-06-20',
      coverAssetKey: 'custom',
      note: 'Buổi sáng ngập trong mây mù mộng mơ.',
      location: 'Sapa',
      category: 'Đặc biệt',
      tags: ['Yêu thương'],
      photos: ['custom', 'trip'],
    },
    {
      id: 'book-7',
      title: 'Cầu hôn',
      occurredOn: '2026-06-20',
      coverAssetKey: 'special',
      note: 'Khoảnh khắc thiêng liêng nhất.',
      location: 'Đà Nẵng',
      category: 'Đặc biệt',
      tags: ['Hạnh phúc', 'Yêu thương'],
      photos: ['special', 'together', 'hero'],
    },
  ];
}

export const addMemoryBookEntry = (entries: MemoryBookEntry[], entry: MemoryBookEntry) => [...entries, entry];
export const updateMemoryBookEntry = (entries: MemoryBookEntry[], entry: MemoryBookEntry) => entries.map((item) => item.id === entry.id ? entry : item);
export const removeMemoryBookEntry = (entries: MemoryBookEntry[], id: string) => entries.filter((item) => item.id !== id);
