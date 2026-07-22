export type MissionCategory = 'daily' | 'weekly' | 'monthly';

export type Mission = {
  id: string;
  title: string;
  description?: string;
  category: MissionCategory;
  imageLabel?: string;
  xp: number;
  completed: boolean;
  completedAt?: string;
};

export type UserProgress = {
  level: number;
  currentXp: number;
  maxXp: number;
  streakDays: number;
  completedCountToday: number;
};

export type MissionViewMode = 'hub' | 'list' | 'streak';
