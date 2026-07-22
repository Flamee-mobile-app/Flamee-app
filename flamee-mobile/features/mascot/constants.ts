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
  great: {
    message: 'Hôm nay thật tuyệt vời! Cùng chia sẻ với người ấy nhé.',
    hasUnreadNudge: false,
  },
  very_happy: {
    message: 'Niềm vui đang lan tỏa! Nhắn gửi người ấy ngay nào.',
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
  very_sad: {
    message: 'Một cái ôm ấm áp lúc này sẽ ý nghĩa lắm đấy.',
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
  default: {
    message: 'Lúc này ai cũng cần một cái ôm. Mình ở đây bên bạn nhé.',
    hasUnreadNudge: true,
  },
};

export const MASCOT_MOOD_LABELS: Record<MascotMood, string> = {
  surprised: 'Bất ngờ',
  very_sad: 'Khóc huhu',
  angry: 'Tức giận',
  sad: 'Buồn',
  great: 'Ôm miếng coi',
  happy: 'Hạnh phúc',
  very_happy: 'Vui quá đi thôi',
  neutral: 'Tĩnh tâm',
  tired: 'Buồn ngủ',
  calm: 'Mệt mỏi',
  default: 'Tuyệt vọng',
};
