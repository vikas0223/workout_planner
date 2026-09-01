/**
 * Local Program Repository (IndexedDB Backed)
 * Implements ProgramRepository for Program, ProgramWeek, and ProgramDay entities.
 * Reconstructs normalized database records into rich domain Program models.
 */

import { ProgramRepository } from '@/lib/repositories/interfaces';
import { Program, ProgramWeek, ProgramDay, ProgramStatus } from '@/types/domain';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import {
  STORES,
  LocalProgramRecord,
  LocalProgramWeekRecord,
  LocalProgramDayRecord,
  SyncQueueRecord,
} from '@/lib/storage/indexeddb-schema';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';

export class LocalProgramRepository implements ProgramRepository {
  constructor(
    private engine: IndexedDBEngine = IndexedDBEngine.getInstance(),
    private invalidationBus: ProgressInvalidationBus = ProgressInvalidationBus.getInstance()
  ) {}

  public async getProgramById(id: string): Promise<Program | null> {
    try {
      const record = await this.engine.get<LocalProgramRecord>(STORES.PROGRAMS, id);
      if (!record || record.deletedAt) return null;

      // Fetch non-deleted weeks for this program
      const weekRecords = await this.engine.getByIndex<LocalProgramWeekRecord>(
        STORES.PROGRAM_WEEKS,
        'programId',
        id
      );
      const validWeekRecords = weekRecords.filter((w) => !w.deletedAt);

      // Fetch non-deleted days for this program
      const dayRecords = await this.engine.getByIndex<LocalProgramDayRecord>(
        STORES.PROGRAM_DAYS,
        'programId',
        id
      );
      const validDayRecords = dayRecords.filter((d) => !d.deletedAt);

      const weeks: ProgramWeek[] = validWeekRecords
        .sort((a, b) => a.weekNumber - b.weekNumber)
        .map((wRec) => {
          const matchingDays = validDayRecords
            .filter((d) => d.programWeekId === wRec.id)
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map((d) => d.programDay);

          return {
            ...wRec.programWeek,
            days: matchingDays,
          };
        });

      return {
        ...record.program,
        weeks,
      };
    } catch (err) {
      console.error('[LocalProgramRepository] Failed to get program by ID:', err);
      return null;
    }
  }

  public async getActiveProgram(userId?: string): Promise<Program | null> {
    const all = await this.listPrograms(userId);
    return all.find((p) => p.status === 'active') || null;
  }

  public async listPrograms(userId?: string): Promise<Program[]> {
    try {
      const ownerId = userId || 'guest_user';
      const records = await this.engine.getByIndex<LocalProgramRecord>(
        STORES.PROGRAMS,
        'ownerId',
        ownerId
      );

      const activeRecords = records.filter((r) => !r.deletedAt);
      const programs: Program[] = [];

      for (const rec of activeRecords) {
        const fullProgram = await this.getProgramById(rec.id);
        if (fullProgram) {
          programs.push(fullProgram);
        }
      }

      return programs.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (err) {
      console.error('[LocalProgramRepository] Failed to list programs:', err);
      return [];
    }
  }

  public async saveProgram(program: Program): Promise<void> {
    const now = new Date().toISOString();
    const ownerId = program.userId || 'guest_user';
    const ownerKind = program.userId ? 'user' : 'guest';

    // If activating this program, deactivate other active programs for this user
    if (program.status === 'active') {
      const existing = await this.listPrograms(program.userId);
      for (const p of existing) {
        if (p.id !== program.id && p.status === 'active') {
          const oldRec = await this.engine.get<LocalProgramRecord>(STORES.PROGRAMS, p.id);
          const pausedVersion = (oldRec?.version || 0) + 1;
          const pausedProgram = { ...p, status: 'paused' as const, updatedAt: now };
          const pausedRecord: LocalProgramRecord = {
            id: p.id,
            ownerKind: p.userId ? 'user' : 'guest',
            ownerId: p.userId || 'guest_user',
            program: pausedProgram,
            version: pausedVersion,
            syncStatus: 'queued',
            createdAt: p.createdAt,
            updatedAt: now,
            clientUpdatedAt: now,
            deletedAt: null,
          };
          await this.engine.put<LocalProgramRecord>(STORES.PROGRAMS, pausedRecord);

          const syncItem: SyncQueueRecord = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            operation: 'upsert',
            entityType: 'programs',
            entityId: p.id,
            idempotencyKey: `prog_${p.id}_${now}`,
            payload: pausedProgram as unknown as Record<string, unknown>,
            baseVersion: pausedVersion,
            baseUpdatedAt: now,
            retryCount: 0,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
            nextAttemptAt: now,
            lastAttemptAt: null,
            processedAt: null,
            errorData: null,
          };
          await this.engine.put(STORES.SYNC_QUEUE, syncItem);
        }
      }
    }

    const existingProgRec = await this.engine.get<LocalProgramRecord>(STORES.PROGRAMS, program.id);
    const newProgVersion = (existingProgRec?.version || 0) + 1;

    // 1. Save Program record
    const programRecord: LocalProgramRecord = {
      id: program.id,
      ownerKind,
      ownerId,
      program: {
        ...program,
        updatedAt: now,
      },
      version: newProgVersion,
      syncStatus: 'queued',
      createdAt: program.createdAt || now,
      updatedAt: now,
      clientUpdatedAt: now,
      deletedAt: null,
    };
    await this.engine.put(STORES.PROGRAMS, programRecord);

    // 2. Soft-delete removed weeks and days not present in incoming program
    const existingStoredWeeks = await this.engine.getByIndex<LocalProgramWeekRecord>(
      STORES.PROGRAM_WEEKS,
      'programId',
      program.id
    );
    const incomingWeekIds = new Set((program.weeks || []).map((w) => w.id));
    for (const oldW of existingStoredWeeks) {
      if (!incomingWeekIds.has(oldW.id) && !oldW.deletedAt) {
        oldW.deletedAt = now;
        oldW.updatedAt = now;
        oldW.clientUpdatedAt = now;
        oldW.syncStatus = 'queued';
        await this.engine.put(STORES.PROGRAM_WEEKS, oldW);
      }
    }

    const existingStoredDays = await this.engine.getByIndex<LocalProgramDayRecord>(
      STORES.PROGRAM_DAYS,
      'programId',
      program.id
    );
    const incomingDayIds = new Set(
      (program.weeks || []).flatMap((w) => (w.days || []).map((d) => d.id))
    );
    for (const oldD of existingStoredDays) {
      if (!incomingDayIds.has(oldD.id) && !oldD.deletedAt) {
        oldD.deletedAt = now;
        oldD.updatedAt = now;
        oldD.clientUpdatedAt = now;
        oldD.syncStatus = 'queued';
        await this.engine.put(STORES.PROGRAM_DAYS, oldD);
      }
    }

    // 3. Save Weeks and Days
    if (program.weeks && program.weeks.length > 0) {
      for (const week of program.weeks) {
        const existingWeekRec = await this.engine.get<LocalProgramWeekRecord>(STORES.PROGRAM_WEEKS, week.id);
        const weekRecord: LocalProgramWeekRecord = {
          id: week.id,
          ownerKind,
          ownerId,
          programId: program.id,
          weekNumber: week.weekNumber,
          programWeek: {
            ...week,
            programId: program.id,
          },
          version: (existingWeekRec?.version || 0) + 1,
          syncStatus: 'queued',
          createdAt: existingWeekRec?.createdAt || now,
          updatedAt: now,
          clientUpdatedAt: now,
          deletedAt: null,
        };
        await this.engine.put(STORES.PROGRAM_WEEKS, weekRecord);

        if (week.days && week.days.length > 0) {
          for (const day of week.days) {
            const existingDayRec = await this.engine.get<LocalProgramDayRecord>(STORES.PROGRAM_DAYS, day.id);
            const dayRecord: LocalProgramDayRecord = {
              id: day.id,
              ownerKind,
              ownerId,
              programId: program.id,
              programWeekId: week.id,
              dayNumber: day.dayNumber,
              workoutTemplateId: day.workoutTemplateId || null,
              status: day.status,
              programDay: {
                ...day,
                programId: program.id,
                programWeekId: week.id,
              },
              version: (existingDayRec?.version || 0) + 1,
              syncStatus: 'queued',
              createdAt: existingDayRec?.createdAt || now,
              updatedAt: now,
              clientUpdatedAt: now,
              deletedAt: null,
            };
            await this.engine.put(STORES.PROGRAM_DAYS, dayRecord);
          }
        }
      }
    }

    // 4. Queue sync outbox
    const syncItem: SyncQueueRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operation: 'upsert',
      entityType: 'programs',
      entityId: program.id,
      idempotencyKey: `prog_${program.id}_${now}`,
      payload: program as unknown as Record<string, unknown>,
      baseVersion: newProgVersion,
      baseUpdatedAt: now,
      retryCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    };
    await this.engine.put(STORES.SYNC_QUEUE, syncItem);

    // 5. Invalidation event
    this.invalidationBus.emit({
      type: 'program_changed',
      entityId: program.id,
      timestamp: Date.now(),
    });
  }

  public async deleteProgram(id: string): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.engine.get<LocalProgramRecord>(STORES.PROGRAMS, id);
    if (!existing) return;

    // Soft delete program
    existing.deletedAt = now;
    existing.updatedAt = now;
    existing.clientUpdatedAt = now;
    existing.syncStatus = 'queued';
    await this.engine.put(STORES.PROGRAMS, existing);

    // Soft delete child weeks
    const weeks = await this.engine.getByIndex<LocalProgramWeekRecord>(
      STORES.PROGRAM_WEEKS,
      'programId',
      id
    );
    for (const w of weeks) {
      w.deletedAt = now;
      w.updatedAt = now;
      w.clientUpdatedAt = now;
      w.syncStatus = 'queued';
      await this.engine.put(STORES.PROGRAM_WEEKS, w);
    }

    // Soft delete child days
    const days = await this.engine.getByIndex<LocalProgramDayRecord>(
      STORES.PROGRAM_DAYS,
      'programId',
      id
    );
    for (const d of days) {
      d.deletedAt = now;
      d.updatedAt = now;
      d.clientUpdatedAt = now;
      d.syncStatus = 'queued';
      await this.engine.put(STORES.PROGRAM_DAYS, d);
    }

    // Enqueue sync queue delete record
    const syncItem: SyncQueueRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operation: 'delete',
      entityType: 'programs',
      entityId: id,
      idempotencyKey: `prog_del_${id}_${now}`,
      payload: { id, deletedAt: now },
      baseVersion: existing.version,
      baseUpdatedAt: now,
      retryCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    };
    await this.engine.put(STORES.SYNC_QUEUE, syncItem);

    this.invalidationBus.emit({
      type: 'program_changed',
      entityId: id,
      timestamp: Date.now(),
    });
  }

  public async saveProgramDay(day: ProgramDay): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.engine.get<LocalProgramDayRecord>(STORES.PROGRAM_DAYS, day.id);
    const parent = await this.engine.get<LocalProgramRecord>(STORES.PROGRAMS, day.programId);
    const ownerId = parent?.ownerId || existing?.ownerId || 'guest_user';
    const ownerKind = parent?.ownerKind || existing?.ownerKind || 'guest';

    const dayRecord: LocalProgramDayRecord = {
      id: day.id,
      ownerKind,
      ownerId,
      programId: day.programId,
      programWeekId: day.programWeekId,
      dayNumber: day.dayNumber,
      workoutTemplateId: day.workoutTemplateId || null,
      status: day.status,
      programDay: day,
      version: (existing?.version || 0) + 1,
      syncStatus: 'queued',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      clientUpdatedAt: now,
      deletedAt: null,
    };

    await this.engine.put(STORES.PROGRAM_DAYS, dayRecord);

    const syncItem: SyncQueueRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operation: 'upsert',
      entityType: 'program_days',
      entityId: day.id,
      idempotencyKey: `prog_day_${day.id}_${now}`,
      payload: day as unknown as Record<string, unknown>,
      baseVersion: dayRecord.version,
      baseUpdatedAt: now,
      retryCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    };
    await this.engine.put(STORES.SYNC_QUEUE, syncItem);

    this.invalidationBus.emit({
      type: 'program_changed',
      entityId: day.programId,
      timestamp: Date.now(),
    });
  }

  public async getProgramDayById(id: string): Promise<ProgramDay | null> {
    const record = await this.engine.get<LocalProgramDayRecord>(STORES.PROGRAM_DAYS, id);
    if (!record || record.deletedAt) return null;
    return record.programDay;
  }
}
