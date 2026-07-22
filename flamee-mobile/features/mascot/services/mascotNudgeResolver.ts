import type { MoodLevel, MoodSummary } from '@/features/mood/types';

import {
  MASCOT_ACTIONS,
  MASCOT_NUDGE_CONTENT,
  MASCOT_NUDGE_MIN_CONFIDENCE,
} from '../constants';
import type { MascotMood, MascotNudge, MascotSignal } from '../types';

const MOOD_SIGNAL_CONFIG: Record<MascotMood, Pick<MascotSignal, 'mood' | 'confidence' | 'priority'>> = {
  neutral: { mood: 'neutral', confidence: 0.7, priority: 5 },
  happy: { mood: 'happy', confidence: 0.8, priority: 20 },
  great: { mood: 'great', confidence: 0.8, priority: 25 },
  very_happy: { mood: 'very_happy', confidence: 0.85, priority: 30 },
  calm: { mood: 'calm', confidence: 0.8, priority: 10 },
  sad: { mood: 'sad', confidence: 0.85, priority: 70 },
  very_sad: { mood: 'very_sad', confidence: 0.9, priority: 75 },
  tired: { mood: 'tired', confidence: 0.9, priority: 80 },
  angry: { mood: 'angry', confidence: 0.9, priority: 85 },
  surprised: { mood: 'surprised', confidence: 0.85, priority: 65 },
  default: { mood: 'default', confidence: 0.7, priority: 5 },
};

export function createMoodMascotSignal(summary: MoodSummary): MascotSignal {
  const moodKey = (summary.partnerMood.id as MascotMood) in MOOD_SIGNAL_CONFIG
    ? (summary.partnerMood.id as MascotMood)
    : 'neutral';
  const config = MOOD_SIGNAL_CONFIG[moodKey];

  return {
    id: `mood:${summary.partnerMood.id}`,
    source: 'mood',
    ...config,
  };
}

export function resolveMascotNudge(signals: readonly MascotSignal[]): MascotNudge | null {
  const highestPrioritySignal = [...signals]
    .filter((signal) => signal.confidence >= MASCOT_NUDGE_MIN_CONFIDENCE)
    .sort((left, right) => right.priority - left.priority)[0];

  if (!highestPrioritySignal) {
    return null;
  }

  const content = MASCOT_NUDGE_CONTENT[highestPrioritySignal.mood as MascotMood];

  return {
    id: highestPrioritySignal.id,
    mood: highestPrioritySignal.mood,
    message: content.message,
    priority: highestPrioritySignal.priority,
    hasUnreadNudge: content.hasUnreadNudge,
    actions: MASCOT_ACTIONS,
  };
}
