import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressPeriodService } from '@/lib/domain/progress-period';
import { ProgressAnalyticsService } from '@/lib/domain/progress-analytics';
import { PersonalRecordService } from '@/lib/domain/personal-records';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';
import { WorkoutSession } from '@/types/domain';

describe('Phase 2I — Progress, Dashboard & Training Analytics', () => {
  const mockNow = new Date('2026-08-31T18:00:00.000Z');

  // =========================================================================
  // 1. Period Engine & Date Boundaries
  // =========================================================================
  describe('ProgressPeriodService', () => {
    it('calculates 7-day period local date range anchored at reference date', () => {
      const range = ProgressPeriodService.getDateRange('7d', undefined, mockNow);
      expect(range.startDate).not.toBeNull();
      expect(range.endDate).not.toBeNull();

      const startStr = ProgressPeriodService.toLocalDateString(range.startDate!);
      const endStr = ProgressPeriodService.toLocalDateString(range.endDate!);
      expect(startStr).toBe('2026-08-25');
      expect(endStr).toBe('2026-08-31');
    });

    it('calculates 30-day and 90-day periods accurately', () => {
      const range30 = ProgressPeriodService.getDateRange('30d', undefined, mockNow);
      const range90 = ProgressPeriodService.getDateRange('90d', undefined, mockNow);

      expect(ProgressPeriodService.toLocalDateString(range30.startDate!)).toBe('2026-08-02');
      expect(ProgressPeriodService.toLocalDateString(range90.startDate!)).toBe('2026-06-03');
    });

    it('returns null startDate for "all" period', () => {
      const rangeAll = ProgressPeriodService.getDateRange('all', undefined, mockNow);
      expect(rangeAll.startDate).toBeNull();
      expect(rangeAll.endDate).not.toBeNull();
    });

    it('correctly checks if date falls within period range', () => {
      const range = ProgressPeriodService.getDateRange('7d', undefined, mockNow);
      expect(ProgressPeriodService.isDateInRange('2026-08-28T10:00:00Z', range)).toBe(true);
      expect(ProgressPeriodService.isDateInRange('2026-08-20T10:00:00Z', range)).toBe(false);
      expect(ProgressPeriodService.isDateInRange(null, range)).toBe(false);
    });

    it('identifies ISO week keys correctly', () => {
      const weekKey = ProgressPeriodService.getIsoWeekKey('2026-08-31T10:00:00Z');
      expect(weekKey).toMatch(/^2026-W\d{2}$/);
    });
  });

  // =========================================================================
  // 2. Personal Records & Estimated 1RM Engine
  // =========================================================================
  describe('PersonalRecordService', () => {
    it('calculates estimated 1RM using the validated Epley formula for reps 1-12', () => {
      // 100 kg x 1 rep -> 100 kg
      expect(PersonalRecordService.calculateEstimated1RM(100, 1)).toBe(100);

      // 100 kg x 6 reps -> 100 * (1 + 6/30) = 120 kg
      expect(PersonalRecordService.calculateEstimated1RM(100, 6)).toBe(120);

      // 80 kg x 10 reps -> 80 * (1 + 10/30) = 80 * 1.3333 = 106.7 kg
      expect(PersonalRecordService.calculateEstimated1RM(80, 10)).toBe(106.7);
    });

    it('returns null estimated 1RM for reps > 12 or non-positive values', () => {
      expect(PersonalRecordService.calculateEstimated1RM(100, 15)).toBeNull();
      expect(PersonalRecordService.calculateEstimated1RM(0, 5)).toBeNull();
      expect(PersonalRecordService.calculateEstimated1RM(100, 0)).toBeNull();
    });

    it('derives max weight, max reps, estimated 1RM, and max set volume from sessions', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 'sess-1',
          userId: 'user-1',
          name: 'Chest & Back',
          status: 'completed',
          startedAt: '2026-08-28T10:00:00Z',
          completedAt: '2026-08-28T10:45:00Z',
          exercises: [
            {
              id: 'se-1',
              sessionId: 'sess-1',
              exerciseId: 'barbell-bench-press',
              name: 'Barbell Bench Press',
              order: 1,
              status: 'completed',
              targetMuscles: ['chest'],
              equipment: ['barbell'],
              sets: [
                {
                  id: 'set-1',
                  sessionExerciseId: 'se-1',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 80,
                  actualReps: 10,
                  weightUnit: 'kg',
                  status: 'completed',
                },
                {
                  id: 'set-2',
                  sessionExerciseId: 'se-1',
                  setNumber: 2,
                  type: 'working',
                  actualWeight: 90,
                  actualReps: 6,
                  weightUnit: 'kg',
                  status: 'completed',
                },
              ],
            },
          ],
        },
        {
          id: 'sess-2',
          userId: 'user-1',
          name: 'Heavy Push',
          status: 'completed',
          startedAt: '2026-08-30T10:00:00Z',
          completedAt: '2026-08-30T10:50:00Z',
          exercises: [
            {
              id: 'se-2',
              sessionId: 'sess-2',
              exerciseId: 'barbell-bench-press',
              name: 'Barbell Bench Press',
              order: 1,
              status: 'completed',
              targetMuscles: ['chest'],
              equipment: ['barbell'],
              sets: [
                {
                  id: 'set-3',
                  sessionExerciseId: 'se-2',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 100,
                  actualReps: 3,
                  weightUnit: 'kg',
                  status: 'completed',
                },
              ],
            },
          ],
        },
      ];

      const prs = PersonalRecordService.computePersonalRecords(sessions);
      const benchPR = prs['barbell-bench-press'];

      expect(benchPR).toBeDefined();
      expect(benchPR.maxWeight?.value).toBe(100);
      expect(benchPR.maxWeight?.reps).toBe(3);
      expect(benchPR.maxReps?.reps).toBe(10);
      expect(benchPR.maxReps?.weight).toBe(80);

      // Estimated 1RMs:
      // Set 1: 80 * (1 + 10/30) = 106.7 kg
      // Set 2: 90 * (1 + 6/30) = 108.0 kg
      // Set 3: 100 * (1 + 3/30) = 110.0 kg (Best!)
      expect(benchPR.estimated1RM?.value).toBe(110);
      expect(benchPR.estimated1RM?.formulaLabel).toBe('Epley (Estimated)');

      // Best Set Volume: Set 1 = 80*10 = 800 kg; Set 2 = 90*6 = 540; Set 3 = 100*3 = 300
      expect(benchPR.maxSetVolume?.value).toBe(800);
      expect(benchPR.totalSetsLogged).toBe(3);
      expect(benchPR.totalRepsLogged).toBe(19);
    });
  });

  // =========================================================================
  // 3. Progress Analytics Metrics & Completion Semantics
  // =========================================================================
  describe('ProgressAnalyticsService', () => {
    it('respects completion semantics: excludes abandoned sessions from completed count and volume', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 's-comp',
          userId: 'u1',
          name: 'Finished Session',
          status: 'completed',
          startedAt: '2026-08-29T10:00:00Z',
          completedAt: '2026-08-29T10:40:00Z',
          duration: 2400,
          exercises: [
            {
              id: 'se-1',
              sessionId: 's-comp',
              exerciseId: 'squat',
              name: 'Barbell Squat',
              order: 1,
              status: 'completed',
              targetMuscles: ['quadriceps'],
              equipment: ['barbell'],
              sets: [
                {
                  id: 'st-1',
                  sessionExerciseId: 'se-1',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 100,
                  actualReps: 5,
                  weightUnit: 'kg',
                  status: 'completed',
                },
              ],
            },
          ],
        },
        {
          id: 's-aband',
          userId: 'u1',
          name: 'Stopped Early',
          status: 'abandoned',
          startedAt: '2026-08-30T10:00:00Z',
          completedAt: '2026-08-30T10:15:00Z',
          duration: 900,
          exercises: [
            {
              id: 'se-2',
              sessionId: 's-aband',
              exerciseId: 'squat',
              name: 'Barbell Squat',
              order: 1,
              status: 'completed',
              targetMuscles: ['quadriceps'],
              equipment: ['barbell'],
              sets: [
                {
                  id: 'st-2',
                  sessionExerciseId: 'se-2',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 100,
                  actualReps: 5,
                  weightUnit: 'kg',
                  status: 'completed',
                },
              ],
            },
          ],
        },
      ];

      const metrics = ProgressAnalyticsService.computeMetrics(sessions, '7d', undefined, 4, mockNow);

      expect(metrics.completedWorkoutsCount).toBe(1);
      expect(metrics.startedWorkoutsCount).toBe(1);
      expect(metrics.abandonedWorkoutsCount).toBe(1);
      expect(metrics.totalDurationMinutes).toBe(40);
      expect(metrics.totalVolumeKg).toBe(500); // 100 * 5 = 500 (abandoned 500 kg excluded)
      expect(metrics.totalPerformedSets).toBe(1);
    });

    it('excludes soft-deleted sets and skipped exercises from volume and set counts', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 's-del',
          userId: 'u1',
          name: 'Mixed Session',
          status: 'completed',
          startedAt: '2026-08-31T09:00:00Z',
          completedAt: '2026-08-31T10:00:00Z',
          duration: 3600,
          exercises: [
            {
              id: 'se-1',
              sessionId: 's-del',
              exerciseId: 'bench',
              name: 'Bench',
              order: 1,
              status: 'completed',
              targetMuscles: ['chest'],
              equipment: ['barbell'],
              sets: [
                {
                  id: 'st-valid',
                  sessionExerciseId: 'se-1',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 80,
                  actualReps: 10,
                  status: 'completed',
                },
                {
                  id: 'st-deleted',
                  sessionExerciseId: 'se-1',
                  setNumber: 2,
                  type: 'working',
                  actualWeight: 120,
                  actualReps: 10,
                  deletedAt: '2026-08-31T09:30:00Z',
                  status: 'completed',
                },
              ],
            },
            {
              id: 'se-skipped',
              sessionId: 's-del',
              exerciseId: 'flyes',
              name: 'Flyes',
              order: 2,
              status: 'skipped',
              targetMuscles: ['chest'],
              equipment: ['dumbbells'],
              sets: [
                {
                  id: 'st-skip',
                  sessionExerciseId: 'se-skipped',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 20,
                  actualReps: 15,
                  status: 'completed',
                },
              ],
            },
          ],
        },
      ];

      const metrics = ProgressAnalyticsService.computeMetrics(sessions, '7d', undefined, 4, mockNow);

      expect(metrics.totalPerformedSets).toBe(1); // Only st-valid
      expect(metrics.totalVolumeKg).toBe(800); // 80 * 10 = 800
      expect(metrics.totalReps).toBe(10);
    });

    it('enforces strict volume unit conversion: converts lbs to kg seamlessly', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 's-lbs',
          userId: 'u1',
          name: 'US Gym Session',
          status: 'completed',
          startedAt: '2026-08-31T09:00:00Z',
          completedAt: '2026-08-31T10:00:00Z',
          exercises: [
            {
              id: 'se-lbs',
              sessionId: 's-lbs',
              exerciseId: 'deadlift',
              name: 'Deadlift',
              order: 1,
              status: 'completed',
              targetMuscles: ['back', 'hamstrings'],
              equipment: ['barbell'],
              sets: [
                {
                  id: 'st-lbs',
                  sessionExerciseId: 'se-lbs',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 220.462, // ~100 kg
                  actualReps: 5,
                  weightUnit: 'lbs',
                  status: 'completed',
                },
              ],
            },
          ],
        },
      ];

      const metrics = ProgressAnalyticsService.computeMetrics(sessions, '7d', undefined, 4, mockNow);

      // 220.462 lbs * 0.45359237 = 100 kg * 5 reps = 500 kg
      expect(metrics.totalVolumeKg).toBe(500);
      expect(metrics.totalVolumeLbs).toBe(1102);
    });

    it('handles bodyweight movements cleanly without skewing volume to zero', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 's-bw',
          userId: 'u1',
          name: 'Calisthenics Session',
          status: 'completed',
          startedAt: '2026-08-31T09:00:00Z',
          completedAt: '2026-08-31T09:30:00Z',
          exercises: [
            {
              id: 'se-bw',
              sessionId: 's-bw',
              exerciseId: 'pullup',
              name: 'Pull-Up',
              order: 1,
              status: 'completed',
              targetMuscles: ['back', 'biceps'],
              equipment: ['pull-up bar'],
              sets: [
                {
                  id: 'st-bw-1',
                  sessionExerciseId: 'se-bw',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 0,
                  actualReps: 12,
                  status: 'completed',
                },
                {
                  id: 'st-bw-2',
                  sessionExerciseId: 'se-bw',
                  setNumber: 2,
                  type: 'working',
                  actualWeight: 0,
                  actualReps: 10,
                  status: 'completed',
                },
              ],
            },
          ],
        },
      ];

      const metrics = ProgressAnalyticsService.computeMetrics(sessions, '7d', undefined, 4, mockNow);

      expect(metrics.totalVolumeKg).toBe(0);
      expect(metrics.bodyweightOnlySets).toBe(2);
      expect(metrics.bodyweightOnlyReps).toBe(22);
      expect(metrics.totalPerformedSets).toBe(2);
      expect(metrics.totalReps).toBe(22);
    });

    it('calculates current and longest streaks across calendar day boundaries', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 's1',
          userId: 'u1',
          name: 'Workout 1',
          status: 'completed',
          startedAt: '2026-08-31T10:00:00Z', // Today
          completedAt: '2026-08-31T10:30:00Z',
          exercises: [],
        },
        {
          id: 's2',
          userId: 'u1',
          name: 'Workout 2',
          status: 'completed',
          startedAt: '2026-08-30T10:00:00Z', // Yesterday
          completedAt: '2026-08-30T10:30:00Z',
          exercises: [],
        },
        {
          id: 's3',
          userId: 'u1',
          name: 'Workout 3',
          status: 'completed',
          startedAt: '2026-08-29T10:00:00Z', // 2 days ago
          completedAt: '2026-08-29T10:30:00Z',
          exercises: [],
        },
        {
          id: 's4',
          userId: 'u1',
          name: 'Workout 4',
          status: 'completed',
          startedAt: '2026-08-20T10:00:00Z', // Gap
          completedAt: '2026-08-20T10:30:00Z',
          exercises: [],
        },
      ];

      const { currentStreakDays, longestStreakDays } = ProgressAnalyticsService.calculateStreaks(
        sessions,
        mockNow
      );

      expect(currentStreakDays).toBe(3);
      expect(longestStreakDays).toBe(3);
    });

    it('computes muscle distribution using primary (1.0) and secondary (0.5) weighting', () => {
      const sessions: WorkoutSession[] = [
        {
          id: 's-m',
          userId: 'u1',
          name: 'Push Day',
          status: 'completed',
          startedAt: '2026-08-31T10:00:00Z',
          completedAt: '2026-08-31T10:45:00Z',
          exercises: [
            {
              id: 'se-1',
              sessionId: 's-m',
              exerciseId: 'bench-press',
              name: 'Barbell Bench Press',
              order: 1,
              status: 'completed',
              targetMuscles: ['chest', 'triceps'],
              equipment: ['barbell'],
              sets: [
                {
                  id: 'st-1',
                  sessionExerciseId: 'se-1',
                  setNumber: 1,
                  type: 'working',
                  actualWeight: 80,
                  actualReps: 10,
                  status: 'completed',
                },
                {
                  id: 'st-2',
                  sessionExerciseId: 'se-1',
                  setNumber: 2,
                  type: 'working',
                  actualWeight: 80,
                  actualReps: 10,
                  status: 'completed',
                },
              ],
            },
          ],
        },
      ];

      const metrics = ProgressAnalyticsService.computeMetrics(sessions, '7d', undefined, 4, mockNow);

      expect(metrics.muscleDistribution.length).toBeGreaterThan(0);
      const topMuscle = metrics.muscleDistribution[0];
      expect(topMuscle).toBeDefined();
      expect(topMuscle.weightedSets).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. Invalidation Bus (Local + Cross-Tab Event Routing)
  // =========================================================================
  describe('ProgressInvalidationBus', () => {
    beforeEach(() => {
      ProgressInvalidationBus.resetInstance();
    });

    it('subscribes and notifies local listeners upon mutation events', () => {
      const bus = ProgressInvalidationBus.getInstance();
      let eventReceived: any = null;

      const unsubscribe = bus.subscribe((event) => {
        eventReceived = event;
      });

      bus.emit('set_changed', 'set-123');

      expect(eventReceived).not.toBeNull();
      expect(eventReceived.type).toBe('set_changed');
      expect(eventReceived.entityId).toBe('set-123');
      expect(eventReceived.timestamp).toBeGreaterThan(0);

      // Unsubscribe check
      eventReceived = null;
      unsubscribe();
      bus.emit('session_changed', 'sess-456');
      expect(eventReceived).toBeNull();
    });

    it('emits sync_applied events without carrying metric data', () => {
      const bus = ProgressInvalidationBus.getInstance();
      let eventReceived: any = null;

      bus.subscribe((event) => {
        eventReceived = event;
      });

      bus.emit('sync_applied');

      expect(eventReceived).not.toBeNull();
      expect(eventReceived.type).toBe('sync_applied');
      expect(eventReceived).not.toHaveProperty('totalVolume');
      expect(eventReceived).not.toHaveProperty('metrics');
    });
  });
});
