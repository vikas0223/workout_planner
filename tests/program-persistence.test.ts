import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { LocalProgramRepository } from '@/lib/repositories/local/local-program-repository';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, DB_VERSION } from '@/lib/storage/indexeddb-schema';
import { Program } from '@/types/domain';

describe('Phase 2J: Program Persistence & IndexedDB v2 Migration', () => {
  let programRepo: LocalProgramRepository;
  let engine: IndexedDBEngine;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    engine = IndexedDBEngine.getInstance();
    programRepo = new LocalProgramRepository(engine);
  });

  it('verifies DB_VERSION is 2 and stores exist', () => {
    expect(DB_VERSION).toBe(2);
    expect(STORES.PROGRAMS).toBe('programs');
    expect(STORES.PROGRAM_WEEKS).toBe('program_weeks');
    expect(STORES.PROGRAM_DAYS).toBe('program_days');
    expect(STORES.FITNESS_GOALS).toBe('fitness_goals');
    expect(STORES.CHALLENGES).toBe('challenges');
    expect(STORES.CHALLENGE_PROGRESS).toBe('challenge_progress');
  });

  it('saves, retrieves, and normalizes a multi-week program', async () => {
    const programId = 'prog_persist_test';
    const program: Program = {
      id: programId,
      userId: 'user_persist',
      name: 'Persistence Test Cycle',
      description: 'Testing DB writes',
      goal: 'hypertrophy',
      difficulty: 'intermediate',
      status: 'active',
      weeks: [
        {
          id: 'pw_test_1',
          programId,
          weekNumber: 1,
          label: 'Week 1',
          days: [
            {
              id: 'pd_test_1_1',
              programId,
              programWeekId: 'pw_test_1',
              dayNumber: 1,
              type: 'workout',
              label: 'Chest & Back',
              workoutTemplateId: 'tpl_chest_back',
              status: 'planned',
              scheduledDate: '2026-09-01',
              effectiveDate: '2026-09-01',
            },
          ],
        },
      ],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    await programRepo.saveProgram(program);

    const retrieved = await programRepo.getProgramById(programId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(programId);
    expect(retrieved?.name).toBe('Persistence Test Cycle');
    expect(retrieved?.weeks.length).toBe(1);
    expect(retrieved?.weeks[0].days.length).toBe(1);
    expect(retrieved?.weeks[0].days[0].workoutTemplateId).toBe('tpl_chest_back');
  });

  it('soft deletes a program along with child weeks and days', async () => {
    const programId = 'prog_delete_test';
    const program: Program = {
      id: programId,
      userId: 'user_delete',
      name: 'To Delete',
      status: 'draft',
      weeks: [
        {
          id: 'pw_del_1',
          programId,
          weekNumber: 1,
          days: [
            { id: 'pd_del_1_1', programId, programWeekId: 'pw_del_1', dayNumber: 1, type: 'rest', status: 'planned' },
          ],
        },
      ],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    await programRepo.saveProgram(program);
    await programRepo.deleteProgram(programId);

    const retrieved = await programRepo.getProgramById(programId);
    expect(retrieved).toBeNull();

    const rawWeeks = await engine.getAll<any>(STORES.PROGRAM_WEEKS);
    const rawDays = await engine.getAll<any>(STORES.PROGRAM_DAYS);
    expect(rawWeeks.find((w) => w.id === 'pw_del_1')?.deletedAt).toBeTruthy();
    expect(rawDays.find((d) => d.id === 'pd_del_1_1')?.deletedAt).toBeTruthy();
  });
});
