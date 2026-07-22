import type { Href } from 'expo-router';

export type MascotMood =
  | 'neutral'
  | 'happy'
  | 'calm'
  | 'sad'
  | 'tired'
  | 'angry'
  | 'surprised';

export type MascotSignal = {
  id: string;
  source: 'mood';
  mood: MascotMood;
  confidence: number;
  priority: number;
};

export type MascotAction = {
  id: 'mood' | 'ai';
  label: string;
  href: Href;
};

export type MascotNudge = {
  id: string;
  mood: MascotMood;
  message: string;
  priority: number;
  hasUnreadNudge: boolean;
  actions: readonly [MascotAction, MascotAction];
};

export type MascotNudgeContent = Pick<MascotNudge, 'message' | 'hasUnreadNudge'>;
