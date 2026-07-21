import { ROUTES } from '@/shared/lib/navigation/routes';

import type { HomeDashboard } from '@/features/home/types';

const dashboard: HomeDashboard = {
  coupleName: 'An & Bình',
  daysTogether: 365,
  anniversaryLabel: '1 năm bên nhau',
  todayPrompt: 'Hôm nay hãy gửi cho nhau một lời cảm ơn thật cụ thể.',
  highlights: [
    {
      id: 'memory-book',
      title: 'Sổ kỉ niệm',
      description: 'Lưu lại ảnh, note và khoảnh khắc đáng nhớ.',
      route: ROUTES.memoryBook,
      imageLabel: 'Kỉ niệm',
    },
    {
      id: 'mood',
      title: 'Mood checkin',
      description: 'Chạm nhẹ để biết hôm nay người ấy đang thế nào.',
      route: ROUTES.mood,
      imageLabel: 'Mood',
    },
    {
      id: 'missions',
      title: 'Tiny mission',
      description: 'Nhiệm vụ nhỏ để hai bạn gần nhau hơn.',
      route: ROUTES.missions,
      imageLabel: 'Mission',
    },
    {
      id: 'dates',
      title: 'Lịch hẹn hò',
      description: 'Gợi ý và lịch hẹn cho cuối tuần này.',
      route: ROUTES.dates,
      imageLabel: 'Date',
    },
  ],
};

export async function getHomeDashboard(): Promise<HomeDashboard> {
  return dashboard;
}
