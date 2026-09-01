import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { GoalService } from '@/lib/domain/goal-service';
import { LocalGoalRepository } from '@/lib/repositories/local/local-goal-repository';
import { FitnessGoalTarget, WorkoutSession } from '@/types/domain';

describe('Phase 2J: Goals Domain & Dynamic Evaluation', () => {
  let goalRepo: LocalGoalRepository;

  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    goalRepo = new LocalGoalRepository();
  });

  it('evaluates increase direction goal correctly against completed sessions', () => {
    const goal: FitnessGoalTarget = {
      id: 'g_1',
      userId: 'u_1',
      type: 'workouts_completed',
      direction: 'increase',
      targetValue: 10,
      unit: 'workouts',
      startValue: 0,
      startDate: '2026-08-01T00:00:00.000Z',
      status: 'active',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const mockSessions: WorkoutSession[] = Array.from({ length: 7 }, (_, i) => ({
      id: `s_${i}`,
      userId: 'u_1',
      name: `Workout ${i}`,
      status: 'completed',
      startedAt: `2026-08-1${i}T10:00:00.000Z`,
      completedAt: `2026-08-1${i}T11:00:00.000Z`,
      exercises: [],
    }));

    const result = GoalService.evaluateGoal(goal, mockSessions);
    expect(result.currentValue).toBe(7);
    expect(result.percentComplete).toBe(70);
    expect(result.remaining).toBe(3);
    expect(result.isAchieved).toBe(false);
  });

  it('evaluates completed goal state when target is exceeded', () => {
    const goal: FitnessGoalTarget = {
      id: 'g_2',
      type: 'workouts_completed',
      direction: 'increase',
      targetValue: 5,
      unit: 'workouts',
      startDate: '2026-08-01T00:00:00.000Z',
      status: 'active',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const mockSessions: WorkoutSession[] = Array.from({ length: 6 }, (_, i) => ({
      id: `s_${i}`,
      userId: 'u_1',
      name: `Workout ${i}`,
      status: 'completed',
      startedAt: `2026-08-1${i}T10:00:00.000Z`,
      completedAt: `2026-08-1${i}T11:00:00.000Z`,
      exercises: [],
    }));

    const result = GoalService.evaluateGoal(goal, mockSessions);
    expect(result.currentValue).toBe(6);
    expect(result.percentComplete).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.isAchieved).toBe(true);
  });

  it('saves and deletes goal in LocalGoalRepository', async () => {
    const goal: FitnessGoalTarget = {
      id: 'g_persist_1',
      userId: 'user_goals',
      type: 'volume',
      direction: 'increase',
      targetValue: 50000,
      unit: 'kg',
      startDate: '2026-09-01T00:00:00.000Z',
      status: 'active',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    await goalRepo.saveGoal(goal);
    const retrieved = await goalRepo.getGoalById('g_persist_1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.targetValue).toBe(50000);

    await goalRepo.deleteGoal('g_persist_1');
    const deleted = await goalRepo.getGoalById('g_persist_1');
    expect(deleted).toBeNull();
  });

  it('weight goal caution: requiresMetricLog when no body metric history is available', () => {
    const weightGoal: FitnessGoalTarget = {
      id: 'g_weight_1',
      type: 'weight',
      direction: 'decrease',
      targetValue: 70,
      unit: 'kg',
      startDate: '2026-09-01T00:00:00.000Z',
      status: 'active',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    // No body metrics passed
    const result = GoalService.evaluateGoal(weightGoal, [], []);
    expect(result.currentValue).toBeNull();
    expect(result.requiresMetricLog).toBe(true);
    expect(result.trendText).toBe('Add your current weight');
    expect(result.isAchieved).toBe(false);
  });

  it('weight goal: accurately evaluates progress from latest BodyMetricEntry', () => {
    const weightGoal: FitnessGoalTarget = {
      id: 'g_weight_2',
      type: 'weight',
      direction: 'decrease',
      startValue: 80,
      targetValue: 70,
      unit: 'kg',
      startDate: '2026-09-01T00:00:00.000Z',
      status: 'active',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    const metricEntries = [
      { id: 'bm1', date: '2026-09-01', weight: 80, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' },
      { id: 'bm2', date: '2026-09-15', weight: 75, createdAt: '2026-09-15T00:00:00Z', updatedAt: '2026-09-15T00:00:00Z' }, // Latest
    ];

    const result = GoalService.evaluateGoal(weightGoal, [], metricEntries);
    expect(result.currentValue).toBe(75);
    expect(result.percentComplete).toBe(50); // Moved 5kg out of 10kg target = 50%
    expect(result.remaining).toBe(5);
    expect(result.isAchieved).toBe(false);
  });
});
