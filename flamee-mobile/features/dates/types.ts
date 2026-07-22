export type DateDay = {
  id: string;
  label: string;
  date: string;
  fullDate: string; // YYYY-MM-DD
  active: boolean;
};

export type DateCategory = 'movie' | 'food' | 'picnic' | 'walk' | 'travel' | 'other';

export type DateStatus = 'upcoming' | 'completed' | 'cancelled';

export type DateItem = {
  id: string;
  title: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  displayTime: string; // e.g. "19:30, Hôm nay"
  category: DateCategory;
  emoji: string;
  status: DateStatus;
  note?: string;
  imageLabel?: string;
  partnerAccepted?: boolean;
};

export type DateIdea = {
  id: string;
  title: string;
  location: string;
  time: string;
  imageLabel: string;
  emoji: string;
  details: string;
  category: DateCategory;
};

export type DateSchedule = {
  week: DateDay[];
  upcoming: DateItem | null;
  items: DateItem[];
  ideas: DateIdea[];
};

export type CreateDatePayload = {
  title: string;
  location: string;
  date: string;
  time: string;
  category: DateCategory;
  emoji: string;
  note?: string;
};

export type DateFilterType = 'all' | 'upcoming' | 'completed' | 'ideas';

