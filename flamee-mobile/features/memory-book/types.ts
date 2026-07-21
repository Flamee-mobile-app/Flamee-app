export type MemoryBookEntry = {
  id: string;
  title: string;
  occurredOn: string;
  coverAssetKey: string;
  note: string;
  location?: string;
  category?: string;
  tags?: string[];
  photos?: string[];
};

export type MemoryBookDraft = Omit<MemoryBookEntry, 'id'>;
export type MemoryBookView = 'overview' | 'detail' | 'create' | 'edit';

