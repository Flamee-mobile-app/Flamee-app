export type MemoryBookEntry = {
  id: string;
  title: string;
  occurredOn: string;
  coverAssetKey: 'together' | 'birthday' | 'trip';
  note: string;
  location?: string;
};

export type MemoryBookDraft = Omit<MemoryBookEntry, 'id'>;
export type MemoryBookView = 'overview' | 'detail' | 'create' | 'edit';
