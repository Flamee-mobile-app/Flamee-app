import type { Href } from 'expo-router';

export type HomeHighlight = {
  id: string;
  title: string;
  description: string;
  route: Href;
  imageLabel: string;
};

export type HomeDashboard = {
  coupleName: string;
  daysTogether: number;
  anniversaryLabel: string;
  highlights: HomeHighlight[];
  todayPrompt: string;
};
