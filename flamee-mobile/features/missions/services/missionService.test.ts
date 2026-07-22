import {
  sortMissionsWithCompletedFirst,
  completeMissionById,
  calculateNewProgress,
  INITIAL_USER_PROGRESS,
} from './missionService';
import type { Mission } from '../types';

describe('missionService', () => {
  const sampleMissions: Mission[] = [
    { id: '1', title: 'Task 1', category: 'daily', xp: 20, completed: false },
    { id: '2', title: 'Task 2', category: 'daily', xp: 20, completed: true },
    { id: '3', title: 'Task 3', category: 'daily', xp: 20, completed: false },
  ];

  it('should sort completed missions to the top of the list', () => {
    const sorted = sortMissionsWithCompletedFirst(sampleMissions);
    expect(sorted[0].completed).toBe(true);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].completed).toBe(false);
  });

  it('should complete a mission and place it at the top', () => {
    const result = completeMissionById(sampleMissions, '3');
    expect(result.earnedXp).toBe(20);
    expect(result.updatedMissions[0].completed).toBe(true);
  });

  it('should calculate level up when EXP exceeds max XP', () => {
    const { newProgress, didLevelUp } = calculateNewProgress(INITIAL_USER_PROGRESS, 50);
    expect(didLevelUp).toBe(true);
    expect(newProgress.level).toBe(INITIAL_USER_PROGRESS.level + 1);
  });
});
