export type TimelineType =
  | 'together'
  | 'birthday'
  | 'anniversary'
  | 'special'
  | 'holiday'
  | 'custom';

export type TimelineRecurrence = 'none' | 'monthly' | 'yearly';
export type ReminderLeadDays = 1 | 3 | 7;
export type ReminderRecipient = 'couple' | 'self';
export type TimelineStatusFilter = 'all' | 'upcoming' | 'past';
export type TimelineRangeFilter = 'all' | 'next30' | 'past';
export type TimelineView = 'overview' | 'filter' | 'create' | 'edit';
export type CreateTimelineStep = 1 | 2 | 3;

export type TimelineReminder = {
  enabled: true;
  leadDays: ReminderLeadDays;
  time: string;
  recipient: ReminderRecipient;
};

export type TimelineItem = {
  id: string;
  type: TimelineType;
  title: string;
  eventDate: string;
  recurrence: TimelineRecurrence;
  coverAssetKey?: string;
  note?: string;
  reminder?: TimelineReminder;
};

export type TimelineDraft = Omit<TimelineItem, 'id'>;
export type TimelineTypeFilter = TimelineType | 'all';

export type TimelineFilter = {
  status: TimelineStatusFilter;
  type: TimelineTypeFilter;
  range: TimelineRangeFilter;
};

export type RelationshipSummary = {
  daysTogether: number;
  countdownDays: number;
  countdownHours: number;
};

export type TimelineCategory = TimelineTypeFilter;
