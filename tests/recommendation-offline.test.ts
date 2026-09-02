import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import { LocalUserRepository } from '@/lib/repositories/local/local-user-repository';
import { LocalRecommendationRepository } from '@/lib/repositories/local/local-recommendation-repository';
import { ProgressAnalyticsService } from '@/lib/domain/progress-analytics';
import { DeterministicRecommendationEngine, RecommendationContext } from '@/lib/domain/recommendations';

describe('Recommendation Engine Offline E2E (Phase 2K)', () => {
  let engine: IndexedDBEngine;
  let completionRepo: LocalCompletionRepository;
  let userRepo: LocalUserRepository;
  let recRepo: LocalRecommendationRepository;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    engine = IndexedDBEngine.getInstance();
    completionRepo = new LocalCompletionRepository(engine);
    userRepo = new LocalUserRepository(engine);
    recRepo = new LocalRecommendationRepository(engine);
  });

  it('runs 100% offline using locally seeded IndexedDB sessions and persists events', async () => {
    const userId = 'offline_athlete_1';

    // 1. Seed user profile locally
    await userRepo.saveProfile({
      id: userId,
      name: 'Offline Athlete',
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      preferredEquipment: ['barbell', 'dumbbell'],
      preferredMuscleGroups: ['Chest', 'Back'],
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    });

    // 2. Seed 3 consecutive completed sessions locally
    for (let i = 1; i <= 3; i++) {
      await completionRepo.saveSession({
        id: `offline_sess_${i}`,
        userId,
        name: 'Full Body A',
        status: 'completed',
        startedAt: `2026-09-0${i}T09:00:00Z`,
        completedAt: `2026-09-0${i}T10:00:00Z`,
        exercises: [
          {
            id: `se_offline_${i}_1`,
            sessionId: `offline_sess_${i}`,
            exerciseId: 'barbell_deadlift',
            name: 'Barbell Deadlift',
            order: 1,
            targetMuscles: ['Back', 'Hamstrings', 'Glutes'],
            equipment: ['barbell'],
            status: 'completed',
            sets: [
              { id: `s_${i}_1`, sessionExerciseId: `se_offline_${i}_1`, setNumber: 1, type: 'normal', targetReps: 5, actualReps: 5, actualWeight: 140, status: 'completed', rpe: 8 },
              { id: `s_${i}_2`, sessionExerciseId: `se_offline_${i}_1`, setNumber: 2, type: 'normal', targetReps: 5, actualReps: 5, actualWeight: 140, status: 'completed', rpe: 8 },
            ],
          },
        ],
      });
    }

    // 3. Hydrate completely offline
    const profile = await userRepo.getProfile(userId);
    const sessions = await completionRepo.listSessions(userId);
    const metrics = ProgressAnalyticsService.computeMetrics(sessions, '30d', undefined, 3, new Date('2026-09-04T12:00:00Z'));

    const context: RecommendationContext = {
      userId,
      userProfile: profile,
      recentSessions: sessions,
      progressMetrics: metrics,
      currentTime: '2026-09-04T12:00:00Z',
    };

    // 4. Generate recommendations purely locally
    const recs = DeterministicRecommendationEngine.generateRecommendations(context);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].category).toBe('progress_load');
    expect(recs[0].actionPayload.exerciseId).toBe('barbell_deadlift');

    // 5. Persist interaction event locally
    await recRepo.saveEvent(
      {
        id: 'recevt_offline_1',
        userId,
        recommendationType: recs[0].category,
        entityId: recs[0].fingerprint,
        action: 'accepted',
        score: recs[0].score,
        createdAt: '2026-09-04T12:05:00Z',
      },
      'guest',
      userId
    );

    const events = await recRepo.listEvents(userId);
    expect(events.length).toBe(1);
    expect(events[0].entityId).toBe(recs[0].fingerprint);
  });
});
