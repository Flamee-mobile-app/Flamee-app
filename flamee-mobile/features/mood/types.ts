import type { MascotMood } from '@/features/mascot/types';

export type MoodLevel = MascotMood;

export type MoodCheckinItem = {
  id: string;
  mood: MascotMood;
  label: string;
  sticker: any;
  color: string;
};

export type MoodCheckinDraft = {
  selectedMood: MascotMood;
  selectedLabel: string;
  note: string;
};

export type MoodEntry = {
  id: string;
  mood: MascotMood;
  label: string;
  note: string;
  createdAt: string;
  userName: string;
  isPartner?: boolean;
};

export type MoodOption = {
  id: MoodLevel;
  label: string;
  description: string;
  color: string;
};

export type MoodSummary = {
  partnerName: string;
  partnerMood: MoodOption;
  userMood?: MoodEntry;
  options: MoodOption[];
  historyLabels: string[];
};

