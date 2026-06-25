import { flameeTheme } from '@/constants/flameeTheme';
import type { MoodSummary } from '@/features/mood/types';

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
    {
      id: 'miss',
      label: 'Nhớ người ấy',
      description: 'Một tin nhắn nhỏ sẽ rất đúng lúc.',
      color: '#FFD7CC',
    },
  ],
  historyLabels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
};

export async function getMoodSummary(): Promise<MoodSummary> {
  return moodSummary;
}
