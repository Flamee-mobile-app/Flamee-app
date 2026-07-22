import { flameeTheme } from '@/shared/constants/flameeTheme';
import type { MoodCheckinDraft, MoodCheckinItem, MoodEntry, MoodSummary } from '@/features/mood/types';
import { MASCOT_STICKERS } from '@/features/mascot/components/MascotArtwork';

export const MOOD_CHECKIN_OPTIONS: MoodCheckinItem[] = [
  {
    id: 'happy_great',
    mood: 'happy',
    label: 'Tuyệt vời',
    sticker: MASCOT_STICKERS.happy,
    color: '#FF9500',
  },
  {
    id: 'happy_joy',
    mood: 'happy',
    label: 'Hạnh phúc',
    sticker: MASCOT_STICKERS.happy,
    color: '#FF7E67',
  },
  {
    id: 'calm',
    mood: 'calm',
    label: 'Bình yên',
    sticker: MASCOT_STICKERS.calm,
    color: '#34C759',
  },
  {
    id: 'neutral',
    mood: 'neutral',
    label: 'Bình thường',
    sticker: MASCOT_STICKERS.neutral,
    color: '#FF7158',
  },
  {
    id: 'surprised',
    mood: 'surprised',
    label: 'Bất ngờ',
    sticker: MASCOT_STICKERS.surprised,
    color: '#FFCC00',
  },
  {
    id: 'angry',
    mood: 'angry',
    label: 'Giận dữ',
    sticker: MASCOT_STICKERS.angry,
    color: '#FF3B30',
  },
  {
    id: 'tired',
    mood: 'tired',
    label: 'Mệt mỏi',
    sticker: MASCOT_STICKERS.tired,
    color: '#8E8E93',
  },
  {
    id: 'sad',
    mood: 'sad',
    label: 'Buồn',
    sticker: MASCOT_STICKERS.sad,
    color: '#007AFF',
  },
];

let latestUserMood: MoodEntry | undefined = undefined;

const moodSummary: MoodSummary = {
  partnerName: 'Bình',
  partnerMood: {
    id: 'calm',
    label: 'Bình yên',
    description: 'Người ấy đang có một ngày nhẹ nhàng.',
    color: flameeTheme.colors.softCream,
  },
  options: [
    {
      id: 'happy',
      label: 'Vui vẻ',
      description: 'Muốn chia sẻ ngay một chuyện tốt.',
      color: '#FFE6CE',
    },
    {
      id: 'calm',
      label: 'Bình yên',
      description: 'Ổn định, dễ thương và cần một chút quan tâm.',
      color: '#FFF1E4',
    },
    {
      id: 'tired',
      label: 'Hơi mệt',
      description: 'Cần nghỉ ngơi hoặc một lời động viên.',
      color: '#F7F7F7',
    },
  ],
  historyLabels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
};

export async function getMoodSummary(): Promise<MoodSummary> {
  return {
    ...moodSummary,
    userMood: latestUserMood,
  };
}

export async function saveMoodCheckin(draft: MoodCheckinDraft): Promise<MoodEntry> {
  const entry: MoodEntry = {
    id: `mood-${Date.now()}`,
    mood: draft.selectedMood,
    label: draft.selectedLabel || 'Bình thường',
    note: draft.note,
    createdAt: new Date().toISOString(),
    userName: 'Bạn',
    isPartner: false,
  };
  latestUserMood = entry;
  return entry;
}

export async function getLatestMoodCheckin(): Promise<MoodEntry | undefined> {
  return latestUserMood;
}

