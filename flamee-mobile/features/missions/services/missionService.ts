import type { Mission, UserProgress } from '@/features/missions/types';

export const INITIAL_USER_PROGRESS: UserProgress = {
  level: 3,
  currentXp: 60,
  maxXp: 100,
  streakDays: 3,
  completedCountToday: 2,
};

export const MOCK_MISSIONS: Mission[] = [
  // --- DAILY MISSIONS ---
  {
    id: 'm-1',
    title: 'Gửi một lời khen dành cho đối phương',
    description: 'Nói 1 điều bạn trân trọng ở người ấy hôm nay',
    category: 'daily',
    xp: 20,
    completed: false,
  },
  {
    id: 'm-2',
    title: 'Chia sẻ 1 điều biết ơn',
    description: 'Nhắn cho đối phương điều làm bạn mỉm cười',
    category: 'daily',
    xp: 20,
    completed: true,
    completedAt: '2026-07-22T09:30:00Z',
  },
  {
    id: 'm-3',
    title: 'Gửi ảnh đáng yêu cho nhau',
    description: 'Chụp một bức ảnh khoảnh khắc thường ngày',
    category: 'daily',
    xp: 20,
    completed: false,
  },
  {
    id: 'm-5',
    title: 'Lên kế hoạch cho cuối tuần',
    description: 'Chọn 1 địa điểm hẹn hò thú vị',
    category: 'daily',
    xp: 20,
    completed: false,
  },
  {
    id: 'm-6',
    title: 'Gọi video call cho nhau',
    description: 'Dành 15 phút trò chuyện trực tiếp',
    category: 'daily',
    xp: 20,
    completed: false,
  },

  // --- WEEKLY MISSIONS ---
  {
    id: 'm-w1',
    title: 'Cùng nhau nấu một bữa ăn ngon',
    description: 'Trải nghiệm chuẩn bị 1 món ăn cả hai cùng thích',
    category: 'weekly',
    xp: 30,
    completed: false,
  },
  {
    id: 'm-w2',
    title: 'Đi dạo công viên cuối tuần',
    description: 'Thư giãn và trò chuyện ngoài trời',
    category: 'weekly',
    xp: 30,
    completed: false,
  },
  {
    id: 'm-w3',
    title: 'Xem một bộ phim yêu thích cùng nhau',
    description: 'Dành một buổi tối ấm áp bên nhau',
    category: 'weekly',
    xp: 30,
    completed: true,
    completedAt: '2026-07-20T20:00:00Z',
  },

  // --- MONTHLY MISSIONS ---
  {
    id: 'm-m1',
    title: 'Tạo album ảnh kỷ niệm tháng này',
    description: 'Lưu giữ những khoảnh khắc đáng nhớ nhất trong tháng',
    category: 'monthly',
    xp: 50,
    completed: false,
  },
  {
    id: 'm-m2',
    title: 'Lên kế hoạch chuyến đi dã ngoại',
    description: 'Khám phá một vùng đất mới cùng người ấy',
    category: 'monthly',
    xp: 50,
    completed: false,
  },
  {
    id: 'm-m3',
    title: 'Viết thư tay gửi cho đối phương',
    description: 'Gửi gắm tình cảm qua từng nét chữ',
    category: 'monthly',
    xp: 50,
    completed: false,
  },
];

/**
 * Sorts missions so completed missions are placed at the top of the list
 */
export function sortMissionsWithCompletedFirst(missions: Mission[]): Mission[] {
  return [...missions].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? -1 : 1; // Completed items go first
  });
}

export function completeMissionById(
  missions: Mission[],
  missionId: string
): { updatedMissions: Mission[]; earnedXp: number; completedMission?: Mission } {
  let earnedXp = 0;
  let completedMission: Mission | undefined;

  const updated = missions.map((m) => {
    if (m.id === missionId && !m.completed) {
      earnedXp = m.xp;
      completedMission = { ...m, completed: true, completedAt: new Date().toISOString() };
      return completedMission;
    }
    return m;
  });

  return {
    updatedMissions: sortMissionsWithCompletedFirst(updated),
    earnedXp,
    completedMission,
  };
}

export function calculateNewProgress(
  current: UserProgress,
  addedXp: number
): { newProgress: UserProgress; didLevelUp: boolean } {
  let { level, currentXp, maxXp, streakDays, completedCountToday } = current;

  currentXp += addedXp;
  completedCountToday += 1;
  let didLevelUp = false;

  if (currentXp >= maxXp) {
    didLevelUp = true;
    level += 1;
    currentXp = currentXp - maxXp;
    maxXp = Math.round(maxXp * 1.25);
  }

  // Increment streak if multiple missions completed today
  if (completedCountToday >= 2 && streakDays === 0) {
    streakDays = 1;
  }

  return {
    newProgress: {
      level,
      currentXp,
      maxXp,
      streakDays,
      completedCountToday,
    },
    didLevelUp,
  };
}

export async function getMissions(): Promise<Mission[]> {
  return sortMissionsWithCompletedFirst(MOCK_MISSIONS);
}
