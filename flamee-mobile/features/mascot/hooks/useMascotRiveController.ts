import { useMemo } from 'react';

import type { MascotMood } from '../types';

export const RIVE_STATE_MACHINE_NAME = 'MascotStateMachine';
export const RIVE_MOOD_INPUT_NAME = 'mood';
export const RIVE_TAP_TRIGGER_NAME = 'tapTrigger';

export const MOOD_RIVE_INPUT_MAP: Record<MascotMood, number> = {
  neutral: 0,
  happy: 1,
  calm: 2,
  sad: 3,
  tired: 4,
  angry: 5,
  surprised: 6,
};

export function useMascotRiveController(mood: MascotMood) {
  const inputStateValue = useMemo(() => MOOD_RIVE_INPUT_MAP[mood] ?? 0, [mood]);

  return {
    stateMachineName: RIVE_STATE_MACHINE_NAME,
    moodInputName: RIVE_MOOD_INPUT_NAME,
    tapTriggerName: RIVE_TAP_TRIGGER_NAME,
    inputStateValue,
  };
}
