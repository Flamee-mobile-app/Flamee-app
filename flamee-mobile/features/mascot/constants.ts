import { ROUTES } from '@/shared/lib/navigation/routes';

import type { MascotAction, MascotMood, MascotNudgeContent } from './types';

export const MASCOT_NUDGE_MIN_CONFIDENCE = 0.7;

export const MASCOT_ACTIONS = [
  { id: 'mood', label: 'Mood check ngay', href: ROUTES.mood },
  { id: 'ai', label: 'Nhắn AI cùng Flamee', href: ROUTES.ai },
] as const satisfies readonly [MascotAction, MascotAction];

export const MASCOT_NUDGE_CONTENT: Record<MascotMood, MascotNudgeContent> = {
  neutral: {
    message: 'Mình ở đây nếu hai bạn muốn chia sẻ một điều nhỏ hôm nay.',
    hasUnreadNudge: false,
  },
  happy: {
    message: 'Có một niềm vui nhỏ đang chờ được chia sẻ đó.',
    hasUnreadNudge: false,
  },
  calm: {
    message: 'Hôm nay có vẻ thật nhẹ nhàng. Mình cùng lưu lại một khoảnh khắc nhé?',
    hasUnreadNudge: false,
  },
  sad: {
    message: 'Có vẻ người ấy đang cần một chút quan tâm. Mình gửi một lời hỏi han nhé?',
    hasUnreadNudge: true,
  },
  tired: {
    message: 'Có vẻ hôm nay hơi dài. Một lời động viên dịu dàng có thể rất đúng lúc.',
    hasUnreadNudge: true,
  },
  angry: {
    message: 'Mình thử dừng lại một nhịp và nói điều đang cần nói thật nhẹ nhàng nhé?',
    hasUnreadNudge: true,
  },
  surprised: {
    message: 'Có một điều mới đang chờ hai bạn khám phá đó.',
    hasUnreadNudge: true,
  },
};

export const MASCOT_MOOD_LABELS: Record<MascotMood, string> = {
  neutral: 'Bình thường',
  happy: 'Rất vui',
  calm: 'Bình yên',
  sad: 'Hơi buồn',
  tired: 'Hơi mệt',
  angry: 'Cần một nhịp thở',
  surprised: 'Bất ngờ',
};
