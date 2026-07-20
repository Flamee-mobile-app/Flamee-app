export type MemoryType =
  | 'together'
  | 'birthday'
  | 'anniversary'
  | 'special'
  | 'holiday'
  | 'custom';

export type MemoryRecurrence = 'none' | 'monthly' | 'yearly';
export type ReminderLeadDays = 1 | 3 | 7;
export type ReminderRecipient = 'couple' | 'self';
export type MemoryStatusFilter = 'all' | 'upcoming' | 'past';
export type MemoryRangeFilter = 'all' | 'next30' | 'past';
export type MemoriesView = 'overview' | 'filter' | 'create' | 'edit';
export type CreateMemoryStep = 1 | 2 | 3;

export type MemoryReminder = {
  enabled: true;
  leadDays: ReminderLeadDays;
  time: string;
  recipient: ReminderRecipient;
};

export type MemoryItem = {
  id: string;
  type: MemoryType;
  title: string;
  eventDate: string;
  recurrence: MemoryRecurrence;
  coverAssetKey?: string;
  note?: string;
  reminder?: MemoryReminder;
};

export type MemoryDraft = Omit<MemoryItem, 'id'>;
export type MemoryTypeFilter = MemoryType | 'all';

export type MemoryFilter = {
  status: MemoryStatusFilter;
  type: MemoryTypeFilter;
  range: MemoryRangeFilter;
};

export type RelationshipSummary = {
  daysTogether: number;
  countdownDays: number;
  countdownHours: number;
};

export type MemoryCategory = MemoryTypeFilter;
