import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { ProgramService } from '@/lib/domain/program-service';
import { LocalProgramRepository, LocalWorkoutRepository, LocalCompletionRepository } from '@/lib/repositories/local';
import { PLATFORM_PROGRAM_CATALOG } from '@/lib/domain/platform-catalogs';
import { Program, ProgramDay } from '@/types/domain';

describe('Phase 2J: Program Domain Service & Adherence', () => {
  let programService: ProgramService;
  let programRepo: LocalProgramRepository;
  let workoutRepo: LocalWorkoutRepository;
  let completionRepo: LocalCompletionRepository;

  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    programRepo = new LocalProgramRepository();
    workoutRepo = new LocalWorkoutRepository();
    completionRepo = new LocalCompletionRepository();
    programService = new ProgramService(programRepo, workoutRepo, completionRepo);
  });

  it('adopts a platform catalog program and clones blueprint into user-owned program', async () => {
    const catalogId = 'prog_cat_4w_upper_lower';
    const adopted = await programService.adoptProgram(catalogId, 'user_123', '2026-09-01');

    expect(adopted).toBeDefined();
    expect(adopted.id).toMatch(/^prog_user_/);
    expect(adopted.userId).toBe('user_123');
    expect(adopted.status).toBe('active');
    expect(adopted.weeks.length).toBe(4);

    // Verify day dates are scheduled sequentially
    const week1 = adopted.weeks[0];
    expect(week1.days.length).toBe(7);
    expect(week1.days[0].scheduledDate).toBe('2026-09-01');
    expect(week1.days[0].effectiveDate).toBe('2026-09-01');
    expect(week1.days[0].status).toBe('planned');
    expect(week1.days[6].scheduledDate).toBe('2026-09-07');
  });

  it('reschedules a program day while preserving original scheduled planned date', async () => {
    const catalogId = 'prog_cat_6w_full_body';
    const adopted = await programService.adoptProgram(catalogId, 'user_123', '2026-09-01');
    const firstDay = adopted.weeks[0].days[0];

    const rescheduled = await programService.rescheduleDay(firstDay.id, '2026-09-05', 'Moved due to travel');

    expect(rescheduled).toBeDefined();
    expect(rescheduled?.status).toBe('rescheduled');
    expect(rescheduled?.scheduledDate).toBe('2026-09-01'); // Preserved original intent
    expect(rescheduled?.effectiveDate).toBe('2026-09-05');
    expect(rescheduled?.notes).toBe('Moved due to travel');
  });

  it('skips a program day', async () => {
    const catalogId = 'prog_cat_3w_home_core';
    const adopted = await programService.adoptProgram(catalogId, 'user_123', '2026-09-01');
    const secondDay = adopted.weeks[0].days[1];

    const skipped = await programService.skipDay(secondDay.id, 'Rest required');
    expect(skipped?.status).toBe('skipped');
    expect(skipped?.notes).toBe('Rest required');
  });

  it('calculates program adherence metrics correctly', () => {
    const mockProgram: Program = {
      id: 'test_prog',
      name: 'Adherence Test',
      weeks: [
        {
          id: 'w1',
          programId: 'test_prog',
          weekNumber: 1,
          days: [
            { id: 'd1', programId: 'test_prog', programWeekId: 'w1', dayNumber: 1, type: 'workout', status: 'completed' },
            { id: 'd2', programId: 'test_prog', programWeekId: 'w1', dayNumber: 2, type: 'workout', status: 'completed' },
            { id: 'd3', programId: 'test_prog', programWeekId: 'w1', dayNumber: 3, type: 'rest', status: 'planned' },
            { id: 'd4', programId: 'test_prog', programWeekId: 'w1', dayNumber: 4, type: 'workout', status: 'rescheduled' },
            { id: 'd5', programId: 'test_prog', programWeekId: 'w1', dayNumber: 5, type: 'workout', status: 'skipped' },
            { id: 'd6', programId: 'test_prog', programWeekId: 'w1', dayNumber: 6, type: 'mobility', status: 'planned' },
            { id: 'd7', programId: 'test_prog', programWeekId: 'w1', dayNumber: 7, type: 'rest', status: 'planned' },
          ],
        },
      ],
      status: 'active',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    const metrics = programService.calculateAdherence(mockProgram);
    expect(metrics.totalDays).toBe(7);
    expect(metrics.totalWorkoutDays).toBe(4);
    expect(metrics.completedWorkoutDays).toBe(2);
    expect(metrics.adherencePercentage).toBe(50); // 2 of 4 = 50%
    expect(metrics.rescheduledDaysCount).toBe(1);
    expect(metrics.skippedDaysCount).toBe(1);
    expect(metrics.isComplete).toBe(false);
  });
});
