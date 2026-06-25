import { completeMissionById } from '@/features/missions/services/missionService';
import type { Mission } from '@/features/missions/types';

describe('mission updates', () => {
  it('returns a new list and marks only the selected mission complete', () => {
    const missions: Mission[] = [
      { id: 'one', title: 'A', xp: 20, completed: false },
      { id: 'two', title: 'B', xp: 20, completed: false },
    ];

    const next = completeMissionById(missions, 'two');

    expect(next).not.toBe(missions);
    expect(next[0]).toBe(missions[0]);
    expect(next[1]).not.toBe(missions[1]);
    expect(next[1].completed).toBe(true);
  });
});
