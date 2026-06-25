import type { MemoryItem } from '@/features/memories/types';

const memories: MemoryItem[] = [
  {
    id: 'first-date',
    title: 'Buổi hẹn đầu tiên',
    description: 'Một buổi tối có trà đào, phim muộn và rất nhiều chuyện để kể.',
    date: '14/02/2025',
    category: 'date',
    imageLabel: 'Hẹn đầu',
  },
  {
    id: 'rain-note',
    title: 'Tin nhắn ngày mưa',
    description: '“Nhớ mang áo khoác nha” trở thành câu nói được lưu lại.',
    date: '18/03/2025',
    category: 'note',
    imageLabel: 'Note',
  },
  {
    id: 'coffee',
    title: 'Quán cà phê quen',
    description: 'Góc bàn cạnh cửa sổ, nơi hai bạn hay ngồi viết kế hoạch cuối tuần.',
    date: '22/04/2025',
    category: 'photo',
    imageLabel: 'Coffee',
  },
  {
    id: 'trip',
    title: 'Chuyến đi biển',
    description: 'Một ngày nắng đẹp và album ảnh có quá nhiều nụ cười.',
    date: '02/06/2025',
    category: 'photo',
    imageLabel: 'Biển',
  },
];

export async function getTimelineMemories(): Promise<MemoryItem[]> {
  return memories;
}

export async function getMemoryGallery(): Promise<MemoryItem[]> {
  return memories;
}
