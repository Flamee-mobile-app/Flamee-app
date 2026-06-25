import type { IconName } from '@/components/ui/IconButton';

export type ProfileStat = {
  label: string;
  value: string;
};

export type ProfileMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
};

export type ProfileData = {
  displayName: string;
  partnerName: string;
  streakDays: number;
  relationshipLabel: string;
  stats: ProfileStat[];
  menuItems: ProfileMenuItem[];
};
