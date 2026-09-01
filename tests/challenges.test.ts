import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { ChallengeService } from '@/lib/domain/challenge-service';
import { LocalChallengeRepository } from '@/lib/repositories/local/local-challenge-repository';
import { PLATFORM_CHALLENGE_CATALOG } from '@/lib/domain/platform-catalogs';
import { Challenge, ChallengeProgress, WorkoutSession } from '@/types/domain';

describe('Phase 2J: Challenges Domain & Dynamic Participation Evaluation', () => {
  let challengeRepo: LocalChallengeRepository;

  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    challengeRepo = new LocalChallengeRepository();
  });

  it('lists platform catalog challenges by default', async () => {
    const list = await challengeRepo.listChallenges();
    expect(list.length).toBeGreaterThanOrEqual(PLATFORM_CHALLENGE_CATALOG.length);
    expect(list.some((c) => c.id === 'chal_cat_7d_consistency')).toBe(true);
  });

  it('evaluates workout count challenge progress dynamically against canonical sessions', () => {
    const challenge: Challenge = {
      id: 'chal_test_1',
      name: '5 Workout Sprint',
      type: 'workout_count',
      targetValue: 5,
      unit: 'workouts',
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.999Z',
      status: 'active',
      createdAt: '2026-08-01T00:00:00.000Z',
    };

    const participation: ChallengeProgress = {
      id: 'cp_1',
      challengeId: 'chal_test_1',
      userId: 'u_1',
      status: 'active',
      joinedAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const sessions: WorkoutSession[] = Array.from({ length: 3 }, (_, i) => ({
      id: `s_${i}`,
      userId: 'u_1',
      name: `Workout ${i}`,
      status: 'completed',
      startedAt: `2026-08-1${i}T10:00:00.000Z`,
      completedAt: `2026-08-1${i}T11:00:00.000Z`,
      exercises: [],
    }));

    const result = ChallengeService.evaluateChallenge(challenge, participation, sessions);
    expect(result.isJoined).toBe(true);
    expect(result.currentValue).toBe(3);
    expect(result.percentComplete).toBe(60);
    expect(result.isCompleted).toBe(false);
  });

  it('saves participation in LocalChallengeRepository and evaluates state', async () => {
    const progress: ChallengeProgress = {
      id: 'cp_join_test',
      challengeId: 'chal_cat_100_sets',
      userId: 'user_chal',
      status: 'active',
      joinedAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    await challengeRepo.saveChallengeProgress(progress);
    const retrieved = await challengeRepo.getUserChallengeProgress('chal_cat_100_sets', 'user_chal');
    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe('active');
    expect(retrieved?.challengeId).toBe('chal_cat_100_sets');
  });
});
