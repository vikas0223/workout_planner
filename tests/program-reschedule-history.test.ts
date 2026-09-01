import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { ProgramService } from '@/lib/domain/program-service';
import { LocalProgramRepository, LocalWorkoutRepository, LocalCompletionRepository } from '@/lib/repositories/local';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import { Program, WorkoutTemplate } from '@/types/domain';

describe('Phase 2J: Program Rescheduling History, Session Retry & Completion-Bearing Invariants', () => {
  let programService: ProgramService;
  let programRepo: LocalProgramRepository;
  let workoutRepo: LocalWorkoutRepository;
  let completionRepo: LocalCompletionRepository;
  let sessionCommandService: SessionCommandService;

  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    programRepo = new LocalProgramRepository();
    workoutRepo = new LocalWorkoutRepository();
    completionRepo = new LocalCompletionRepository();
    programService = new ProgramService(programRepo, workoutRepo, completionRepo);
    sessionCommandService = new SessionCommandService(completionRepo);
  });

  it('Monday original date -> Tuesday effective date -> original date preserved -> status = rescheduled', async () => {
    const program = await programService.adoptProgram('prog_cat_4w_upper_lower', 'user_resched_test', '2026-09-07'); // Monday
    const mondayDay = program.weeks[0].days[0];

    expect(mondayDay.scheduledDate).toBe('2026-09-07');
    expect(mondayDay.effectiveDate).toBe('2026-09-07');
    expect(mondayDay.status).toBe('planned');

    // Reschedule Monday to Tuesday
    const rescheduled = await programService.rescheduleDay(
      mondayDay.id,
      '2026-09-08',
      'Doctor appointment on Monday'
    );

    expect(rescheduled).toBeDefined();
    expect(rescheduled?.status).toBe('rescheduled');
    expect(rescheduled?.scheduledDate).toBe('2026-09-07'); // Original planned intent preserved
    expect(rescheduled?.effectiveDate).toBe('2026-09-08'); // Effective execution target updated
    expect(rescheduled?.notes).toBe('Doctor appointment on Monday');
  });

  it('abandoned session -> retry -> completed session -> completedSessionId points exclusively to successful session', async () => {
    const template: WorkoutTemplate = {
      id: 'tpl_retry_flow',
      name: 'Leg Day Strength',
      goal: 'strength',
      targetMuscles: ['Quads', 'Hamstrings'],
      equipment: ['barbell'],
      duration: 50,
      difficulty: 'intermediate',
      isCustom: false,
      isFavorite: false,
      exercises: [
        {
          id: 'te_squat_1',
          exerciseId: 'ex_barbell_squat',
          name: 'Barbell Squat',
          targetMuscles: ['Quads'],
          equipment: ['barbell'],
          order: 1,
          sets: 3,
          reps: '5',
          rest: '120s',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await workoutRepo.saveTemplate(template);

    const program = await programService.adoptProgram('prog_cat_6w_full_body', 'user_retry_test');
    const day = program.weeks[0].days[0];
    day.workoutTemplateId = template.id;
    await programRepo.saveProgramDay(day);

    // 1. First Attempt: user starts session but abandons
    const firstAttempt = await sessionCommandService.startSession({
      workout: template,
      name: 'Attempt 1 - Interrupted',
    });
    const abandonedSession = await sessionCommandService.abandonSession(firstAttempt.id);
    expect(abandonedSession.status).toBe('abandoned');

    // Attempting to link abandoned session must NOT mark program day complete
    const dayAfterAbandon = await programService.linkCompletedSession(program.id, day.id, abandonedSession.id);
    expect(dayAfterAbandon?.status).toBe('planned');
    expect(dayAfterAbandon?.completedSessionId).toBeUndefined();

    // 2. Retry Attempt: user restarts and completes workout successfully
    const retryAttempt = await sessionCommandService.startSession({
      workout: template,
      name: 'Attempt 2 - Completed',
    });
    const completedSession = await sessionCommandService.completeSession(retryAttempt.id);
    expect(completedSession.status).toBe('completed');

    // Linking successful retry fulfills the program day
    const dayAfterCompletion = await programService.linkCompletedSession(program.id, day.id, completedSession.id);
    expect(dayAfterCompletion?.status).toBe('completed');
    expect(dayAfterCompletion?.completedSessionId).toBe(completedSession.id);
    expect(dayAfterCompletion?.completedSessionId).not.toBe(abandonedSession.id);
  });

  it('completion-bearing invariant: rest/recovery/mobility days do not block program completion when all workout days are done', async () => {
    const singleWeekProgram: Program = {
      id: 'prog_completion_rule',
      userId: 'user_comp_rule',
      name: '1-Week Quick Test',
      status: 'active',
      weeks: [
        {
          id: 'pw_comp_1',
          programId: 'prog_completion_rule',
          weekNumber: 1,
          days: [
            { id: 'pd_c_1', programId: 'prog_completion_rule', programWeekId: 'pw_comp_1', dayNumber: 1, type: 'workout', status: 'completed' },
            { id: 'pd_c_2', programId: 'prog_completion_rule', programWeekId: 'pw_comp_1', dayNumber: 2, type: 'rest', status: 'planned' },
            { id: 'pd_c_3', programId: 'prog_completion_rule', programWeekId: 'pw_comp_1', dayNumber: 3, type: 'workout', status: 'completed' },
            { id: 'pd_c_4', programId: 'prog_completion_rule', programWeekId: 'pw_comp_1', dayNumber: 4, type: 'recovery', status: 'planned' },
            { id: 'pd_c_5', programId: 'prog_completion_rule', programWeekId: 'pw_comp_1', dayNumber: 5, type: 'workout', status: 'completed' },
            { id: 'pd_c_6', programId: 'prog_completion_rule', programWeekId: 'pw_comp_1', dayNumber: 6, type: 'mobility', status: 'planned' },
            { id: 'pd_c_7', programId: 'prog_completion_rule', programWeekId: 'pw_comp_1', dayNumber: 7, type: 'rest', status: 'planned' },
          ],
        },
      ],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    const metrics = programService.calculateAdherence(singleWeekProgram);
    expect(metrics.totalDays).toBe(7);
    expect(metrics.totalWorkoutDays).toBe(3);
    expect(metrics.completedWorkoutDays).toBe(3);
    expect(metrics.adherencePercentage).toBe(100);
    expect(metrics.isComplete).toBe(true); // Complete despite rest/recovery/mobility remaining 'planned'
  });

  it('derives currentWeekNumber dynamically from schedule without stale counter drift', () => {
    const multiWeekProgram: Program = {
      id: 'prog_week_calc',
      name: '4-Week Schedule',
      status: 'active',
      startDate: '2026-09-01T00:00:00.000Z',
      weeks: [
        { id: 'w1', programId: 'prog_week_calc', weekNumber: 1, days: [] },
        { id: 'w2', programId: 'prog_week_calc', weekNumber: 2, days: [] },
        { id: 'w3', programId: 'prog_week_calc', weekNumber: 3, days: [] },
        { id: 'w4', programId: 'prog_week_calc', weekNumber: 4, days: [] },
      ],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    // Day 0 (Sept 1) -> Week 1
    const week1 = ProgramService.deriveCurrentWeekNumber(multiWeekProgram, new Date('2026-09-01T12:00:00Z'));
    expect(week1).toBe(1);

    // Day 8 (Sept 9) -> Week 2
    const week2 = ProgramService.deriveCurrentWeekNumber(multiWeekProgram, new Date('2026-09-09T12:00:00Z'));
    expect(week2).toBe(2);

    // Day 16 (Sept 17) -> Week 3
    const week3 = ProgramService.deriveCurrentWeekNumber(multiWeekProgram, new Date('2026-09-17T12:00:00Z'));
    expect(week3).toBe(3);

    // Day 25 (Sept 26) -> Week 4
    const week4 = ProgramService.deriveCurrentWeekNumber(multiWeekProgram, new Date('2026-09-26T12:00:00Z'));
    expect(week4).toBe(4);
  });
});
