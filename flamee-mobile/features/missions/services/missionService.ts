import type { Mission } from '@/features/missions/types';

const missions: Mission[] = [
  {
    id: 'good-morning',
    title: 'Gửi lời chúc buổi sáng',
    description: 'Một tin nhắn cụ thể về điều bạn mong người ấy có hôm nay.',
    category: 'daily',
    imageLabel: 'Morning',
    xp: 20,
    completed: false,
  },
  {
    id: 'photo',
    title: 'Chụp một khoảnh khắc',
    description: 'Lưu lại một điều nhỏ khiến bạn nhớ tới người ấy.',
    category: 'daily',
    imageLabel: 'Photo',
    xp: 25,
    completed: false,
  },
  {
    id: 'date-plan',
    title: 'Lên ý tưởng hẹn hò',
    description: 'Chọn một địa điểm và một món ăn cho cuối tuần.',
    category: 'weekly',
    imageLabel: 'Plan',
    xp: 40,
    completed: false,
  },
  {
    id: 'surprise-note',
    title: 'Viết một lời bất ngờ',
    description: 'Một câu ngắn nhưng thật lòng, gửi lúc người ấy không ngờ tới.',
    category: 'surprise',
    imageLabel: 'Note',
    xp: 35,
    completed: false,
  },
];

export function completeMissionById(missions: Mission[], missionId: string): Mission[] {
  return missions.map((mission) =>
    mission.id === missionId ? { ...mission, completed: true } : mission,
  );
}

export async function getMissions(): Promise<Mission[]> {
  return missions;
}
