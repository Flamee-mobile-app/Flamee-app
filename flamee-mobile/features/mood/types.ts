export type MoodLevel = 'happy' | 'calm' | 'tired' | 'miss';

export type MoodOption = {
  id: MoodLevel;
  label: string;
  description: string;
  color: string;
};

export type MoodSummary = {
  partnerName: string;
  partnerMood: MoodOption;
  options: MoodOption[];
  historyLabels: string[];
};
