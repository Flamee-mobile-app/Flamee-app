export type MemoryCategory = 'all' | 'photo' | 'note' | 'date';

export type MemoryItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: Exclude<MemoryCategory, 'all'>;
  imageLabel: string;
};
