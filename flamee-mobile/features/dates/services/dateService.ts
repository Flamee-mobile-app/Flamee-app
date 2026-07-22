import type { CreateDatePayload, DateItem, DateSchedule, DateStatus } from '@/features/dates/types';

let mockDateItems: DateItem[] = [
  {
    id: 'movie-1',
    title: 'Đi xem phim rạp',
    location: 'CGV Vincom Metropoint',
    date: '2026-05-14',
    time: '19:30',
    displayTime: '19:30, Hôm nay',
    category: 'movie',
    emoji: '🎬',
    status: 'upcoming',
    note: 'Đã đặt trước 2 vé hàng ghế đôi J9-J10 nè anh yêu!',
    imageLabel: 'Cinema',
    partnerAccepted: true,
  },
  {
    id: 'food-1',
    title: 'Ăn mì cay & trà sữa',
    location: 'Quán mì Sasin gần nhà',
    date: '2026-05-16',
    time: '18:00',
    displayTime: '18:00, Thứ Bảy',
    category: 'food',
    emoji: '🍜',
    status: 'upcoming',
    note: 'Nhớ ghé mua thêm 2 ly trà sữa nướng nha',
    imageLabel: 'Food',
    partnerAccepted: true,
  },
  {
    id: 'picnic-1',
    title: 'Picnic công viên ven sông',
    location: 'Công viên Landmark 81',
    date: '2026-05-10',
    time: '16:00',
    displayTime: '16:00, 10/05/2026',
    category: 'picnic',
    emoji: '🧺',
    status: 'completed',
    note: 'Buổi chiều ngắm hoàng hôn siêu đẹp',
    imageLabel: 'Picnic',
    partnerAccepted: true,
  },
];

export async function getDateSchedule(): Promise<DateSchedule> {
  const upcoming = mockDateItems.find((item) => item.status === 'upcoming') || null;

  return {
    week: [
      { id: 'mon', label: 'T2', date: '11', fullDate: '2026-05-11', active: false },
      { id: 'tue', label: 'T3', date: '12', fullDate: '2026-05-12', active: false },
      { id: 'wed', label: 'T4', date: '13', fullDate: '2026-05-13', active: false },
      { id: 'thu', label: 'T5', date: '14', fullDate: '2026-05-14', active: true },
      { id: 'fri', label: 'T6', date: '15', fullDate: '2026-05-15', active: false },
      { id: 'sat', label: 'T7', date: '16', fullDate: '2026-05-16', active: false },
      { id: 'sun', label: 'CN', date: '17', fullDate: '2026-05-17', active: false },
    ],
    upcoming,
    items: mockDateItems,
    ideas: [
      {
        id: 'picnic',
        title: 'Picnic công viên',
        location: 'Công viên ven sông',
        time: '16:00',
        imageLabel: 'Picnic',
        emoji: '🧺',
        details: 'Công viên thành phố • 16:00',
        category: 'picnic',
      },
      {
        id: 'cooking',
        title: 'Nấu ăn cùng nhau',
        location: 'Tại nhà',
        time: '18:00',
        imageLabel: 'Cooking',
        emoji: '🍳',
        details: 'Căn bếp ấm cúng • 18:00',
        category: 'food',
      },
      {
        id: 'coffee',
        title: 'Cà phê trò chuyện',
        location: 'Quán cafe acoustic',
        time: '20:00',
        imageLabel: 'Coffee',
        emoji: '☕',
        details: 'Góc nhạc nhẹ nhàng • 20:00',
        category: 'food',
      },
      {
        id: 'walk',
        title: 'Đi dạo phố đêm',
        location: 'Phố đi bộ',
        time: '21:00',
        imageLabel: 'Walk',
        emoji: '🌃',
        details: 'Hóng gió & trò chuyện • 21:00',
        category: 'walk',
      },
    ],
  };
}

export async function createDateSchedule(payload: CreateDatePayload): Promise<DateItem> {
  const newItem: DateItem = {
    id: `date-${Date.now()}`,
    title: payload.title,
    location: payload.location,
    date: payload.date,
    time: payload.time,
    displayTime: `${payload.time}, ${payload.date}`,
    category: payload.category,
    emoji: payload.emoji || '💖',
    status: 'upcoming',
    note: payload.note,
    partnerAccepted: false,
  };

  mockDateItems = [newItem, ...mockDateItems];
  return newItem;
}

export async function updateDateStatus(id: string, status: DateStatus): Promise<DateItem | null> {
  const item = mockDateItems.find((i) => i.id === id);
  if (item) {
    item.status = status;
    return { ...item };
  }
  return null;
}

export async function deleteDateSchedule(id: string): Promise<boolean> {
  const initialLength = mockDateItems.length;
  mockDateItems = mockDateItems.filter((i) => i.id !== id);
  return mockDateItems.length < initialLength;
}

