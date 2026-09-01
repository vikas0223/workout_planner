import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { ProgramService } from '@/lib/domain/program-service';
import { LocalProgramRepository, LocalWorkoutRepository, LocalCompletionRepository } from '@/lib/repositories/local';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import { WorkoutTemplate } from '@/types/domain';

describe('Phase 2J: Program Session Integration & Resilience', () => {
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

  it('executes a program day via SessionCommandService and links completed session ID', async () => {
    // 1. Create a workout template
    const template: WorkoutTemplate = {
      id: 'tpl_prog_exec_1',
      name: 'Chest & Back Program Workout',
      goal: 'hypertrophy',
      targetMuscles: ['Chest', 'Back'],
      equipment: ['barbell'],
      duration: 45,
      difficulty: 'intermediate',
      isCustom: false,
      isFavorite: false,
      exercises: [
        {
          id: 'te_1',
          exerciseId: 'ex_bench_press',
          name: 'Barbell Bench Press',
          targetMuscles: ['Chest'],
          equipment: ['barbell'],
          order: 1,
          sets: 2,
          reps: '8',
          rest: '90s',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await workoutRepo.saveTemplate(template);

    // 2. Adopt program
    const program = await programService.adoptProgram('prog_cat_4w_upper_lower', 'user_session_test');
    const day = program.weeks[0].days[0];
    day.workoutTemplateId = template.id;
    await programRepo.saveProgramDay(day);

    // 3. Start workout session using template
    const session = await sessionCommandService.startSession({
      workout: template,
      name: 'Program Day Execution',
    });

    expect(session.status).toBe('active');

    // 4. Log set and complete session
    const exercise = session.exercises[0];
    await sessionCommandService.logSet({
      sessionId: session.id,
      sessionExerciseId: exercise.id,
      actualReps: 8,
      actualWeight: 80,
    });

    const completedSession = await sessionCommandService.completeSession(session.id);
    expect(completedSession.status).toBe('completed');

    // 5. Link completed session to program day
    const linkedDay = await programService.linkCompletedSession(program.id, day.id, completedSession.id);
    expect(linkedDay?.status).toBe('completed');
    expect(linkedDay?.completedSessionId).toBe(completedSession.id);
    expect(linkedDay?.completedAt).toBeDefined();
  });

  it('resilience: abandoned session does NOT fulfill program day completion', async () => {
    const template: WorkoutTemplate = {
      id: 'tpl_prog_abandon_1',
      name: 'Squat Day',
      goal: 'strength',
      targetMuscles: ['Quads'],
      equipment: ['barbell'],
      duration: 45,
      difficulty: 'beginner',
      isCustom: false,
      isFavorite: false,
      exercises: [
        {
          id: 'te_squat',
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

    const program = await programService.adoptProgram('prog_cat_6w_full_body', 'user_abandon_test');
    const day = program.weeks[0].days[0];
    day.workoutTemplateId = template.id;
    await programRepo.saveProgramDay(day);

    const session = await sessionCommandService.startSession({
      workout: template,
    });

    // Abandon session early
    const abandonedSession = await sessionCommandService.abandonSession(session.id);
    expect(abandonedSession.status).toBe('abandoned');

    // Attempting to link abandoned session must preserve planned state
    const resultDay = await programService.linkCompletedSession(program.id, day.id, abandonedSession.id);
    expect(resultDay?.status).toBe('planned');
    expect(resultDay?.completedSessionId).toBeUndefined();
  });
});
