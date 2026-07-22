import { flameeTheme } from '@/shared/constants/flameeTheme';
import type { MoodCheckinDraft, MoodCheckinItem, MoodEntry, MoodSummary } from '@/features/mood/types';
import { MASCOT_STICKERS } from '@/features/mascot/components/MascotArtwork';

export const MOOD_CHECKIN_OPTIONS: MoodCheckinItem[] = [
  {
    id: 'surprised',
    mood: 'surprised',
    label: 'Bất ngờ',
    sticker: MASCOT_STICKERS.surprised,
    color: '#FFCC00',
  },
  {
    id: 'very_sad',
    mood: 'very_sad',
    label: 'Khóc huhu',
    sticker: MASCOT_STICKERS.very_sad,
    color: '#5856D6',
  },
  {
    id: 'angry',
    mood: 'angry',
    label: 'Tức giận',
    sticker: MASCOT_STICKERS.angry,
    color: '#FF3B30',
  },
  {
    id: 'sad',
    mood: 'sad',
    label: 'Buồn',
    sticker: MASCOT_STICKERS.sad,
    color: '#007AFF',
  },
  {
    id: 'great',
    mood: 'great',
    label: 'Ôm miếng coi',
    sticker: MASCOT_STICKERS.great,
    color: '#FF9500',
  },
  {
    id: 'happy',
    mood: 'happy',
    label: 'Hạnh phúc',
    sticker: MASCOT_STICKERS.happy,
    color: '#FF7E67',
  },
  {
    id: 'very_happy',
    mood: 'very_happy',
    label: 'Vui quá đi thôi',
    sticker: MASCOT_STICKERS.very_happy,
    color: '#FFB347',
  },
  {
    id: 'neutral',
    mood: 'neutral',
    label: 'Tĩnh tâm',
    sticker: MASCOT_STICKERS.neutral,
    color: '#34C759',
  },
  {
    id: 'tired',
    mood: 'tired',
    label: 'Buồn ngủ',
    sticker: MASCOT_STICKERS.tired,
    color: '#8E8E93',
  },
  {
    id: 'calm',
    mood: 'calm',
    label: 'Mệt mỏi',
    sticker: MASCOT_STICKERS.calm,
    color: '#A8A8A8',
  },
  {
    id: 'default',
    mood: 'default',
    label: 'Tuyệt vọng',
    sticker: MASCOT_STICKERS.default,
    color: '#5856D6',
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

