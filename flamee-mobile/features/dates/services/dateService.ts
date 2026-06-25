import type { DateSchedule } from '@/features/dates/types';

const schedule: DateSchedule = {
  week: [
    { id: 'mon', label: 'T2', date: '24', active: false },
    { id: 'tue', label: 'T3', date: '25', active: false },
    { id: 'wed', label: 'T4', date: '26', active: true },
    { id: 'thu', label: 'T5', date: '27', active: false },
    { id: 'fri', label: 'T6', date: '28', active: false },
    { id: 'sat', label: 'T7', date: '29', active: false },
    { id: 'sun', label: 'CN', date: '30', active: false },
  ],
  upcoming: {
    id: 'weekend',
    title: 'Tối thứ bảy nhẹ nhàng',
    location: 'Rạp phim và quán mì cay quen',
    time: '19:30, Thứ bảy',
    imageLabel: 'Movie date',
  },
  ideas: [
    {
      id: 'picnic',
      title: 'Picnic công viên',
      location: 'Công viên ven sông',
      time: '16:00',
      imageLabel: 'Picnic',
    },
    {
      id: 'dessert',
      title: 'Đi ăn món ngọt',
      location: 'Tiệm bánh nhỏ gần nhà',
      time: '20:00',
      imageLabel: 'Dessert',
    },
    {
      id: 'walk',
      title: 'Đi dạo không lịch trình',
      location: 'Khu phố cũ',
      time: '18:00',
      imageLabel: 'Walk',
    },
  ],
};

export async function getDateSchedule(): Promise<DateSchedule> {
  return schedule;
}
