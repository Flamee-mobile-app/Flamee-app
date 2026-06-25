export type Mission = {
  id: string;
  title: string;
  description?: string;
  category?: MissionCategory;
  imageLabel?: string;
  xp: number;
  completed: boolean;
};

export type MissionCategory = 'all' | 'daily' | 'weekly' | 'surprise';
