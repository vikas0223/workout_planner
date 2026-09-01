/**
 * Program Domain Service
 * Encapsulates Program lifecycle, catalog adoption, day rescheduling,
 * session execution bridge, and adherence metrics derivation.
 */

import {
  Program,
  ProgramWeek,
  ProgramDay,
  ProgramStatus,
  ProgramDayStatus,
  WorkoutTemplate,
  WorkoutSession,
} from '@/types/domain';
import { PLATFORM_PROGRAM_CATALOG } from './platform-catalogs';
import { ProgramRepository, WorkoutRepository, CompletionRepository } from '@/lib/repositories/interfaces';
import { LocalProgramRepository, LocalWorkoutRepository, LocalCompletionRepository } from '@/lib/repositories/local';

export interface ProgramAdherenceMetrics {
  totalDays: number;
  totalWorkoutDays: number;
  completedWorkoutDays: number;
  adherencePercentage: number;
  rescheduledDaysCount: number;
  skippedDaysCount: number;
  currentWeekNumber: number;
  currentDayNumber: number;
  isComplete: boolean;
}

export class ProgramService {
  constructor(
    private programRepo: ProgramRepository = new LocalProgramRepository(),
    private workoutRepo: WorkoutRepository = new LocalWorkoutRepository(),
    private completionRepo: CompletionRepository = new LocalCompletionRepository()
  ) {}

  /**
   * Adopts a program from the platform catalog into the user's active training system.
   * Clones templates and program structure with unique user IDs.
   */
  public async adoptProgram(
    catalogId: string,
    userId?: string,
    startDateStr?: string
  ): Promise<Program> {
    const blueprint = PLATFORM_PROGRAM_CATALOG.find((p) => p.id === catalogId);
    if (!blueprint) {
      throw new Error(`[ProgramService] Platform catalog program '${catalogId}' not found.`);
    }

    const now = new Date();
    const startDate = startDateStr ? new Date(startDateStr) : now;
    const programId = `prog_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Materialize WorkoutTemplates from blueprints if referenced
    const templateIdMap: Record<string, string> = {};
    if (blueprint.templateBlueprints) {
      for (const [key, tplData] of Object.entries(blueprint.templateBlueprints)) {
        const tplId = `tpl_${programId}_${key}`;
        templateIdMap[key] = tplId;

        const newTemplate: WorkoutTemplate = {
          id: tplId,
          userId,
          name: tplData.name,
          goal: blueprint.goal || 'hypertrophy',
          targetMuscles: tplData.targetMuscles,
          equipment: tplData.equipment,
          duration: tplData.durationMinutes,
          difficulty: blueprint.difficulty || 'beginner',
          isCustom: false,
          isFavorite: false,
          exercises: tplData.exercises.map((ex, idx) => ({
            id: `ex_${tplId}_${idx + 1}`,
            exerciseId: ex.exerciseId,
            name: ex.name,
            targetMuscles: ex.targetMuscles,
            equipment: ex.equipment,
            order: idx + 1,
            sets: ex.plannedSets,
            reps: String(ex.plannedReps),
            rest: `${ex.plannedRestSeconds}s`,
          })),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        await this.workoutRepo.saveTemplate(newTemplate);
      }
    }

    // 2. Clone Weeks and Days with explicit scheduled dates
    const weeks: ProgramWeek[] = blueprint.weeks.map((w, wIdx) => {
      const weekId = `pw_${programId}_w${w.weekNumber}`;
      const days: ProgramDay[] = w.days.map((d) => {
        const dayOffset = wIdx * 7 + (d.dayNumber - 1);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayOffset);
        const dy = dayDate.getFullYear();
        const dm = String(dayDate.getMonth() + 1).padStart(2, '0');
        const dd = String(dayDate.getDate()).padStart(2, '0');
        const scheduledDateStr = `${dy}-${dm}-${dd}`;

        const mappedTemplateId = d.workoutTemplateId
          ? templateIdMap[d.workoutTemplateId] || d.workoutTemplateId
          : undefined;

        return {
          id: `pd_${programId}_w${w.weekNumber}_d${d.dayNumber}`,
          programId,
          programWeekId: weekId,
          dayNumber: d.dayNumber,
          type: d.type,
          label: d.label,
          workoutTemplateId: mappedTemplateId,
          status: 'planned' as ProgramDayStatus,
          scheduledDate: scheduledDateStr,
          effectiveDate: scheduledDateStr,
          notes: d.notes,
        };
      });

      return {
        id: weekId,
        programId,
        weekNumber: w.weekNumber,
        label: w.label,
        days,
      };
    });

    const userProgram: Program = {
      id: programId,
      userId,
      name: blueprint.name,
      description: blueprint.description,
      goal: blueprint.goal,
      difficulty: blueprint.difficulty,
      weeks,
      status: 'active' as ProgramStatus,
      startDate: startDate.toISOString(),
      currentWeekNumber: 1,
      currentDayNumber: 1,
      isCustom: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await this.programRepo.saveProgram(userProgram);
    return userProgram;
  }

  /**
   * Reschedules a program day while preserving the original planned intent.
   */
  public async rescheduleDay(
    dayId: string,
    newEffectiveDateStr: string,
    notes?: string
  ): Promise<ProgramDay | null> {
    const day = await this.programRepo.getProgramDayById(dayId);
    if (!day) return null;

    const updatedDay: ProgramDay = {
      ...day,
      effectiveDate: newEffectiveDateStr,
      status: 'rescheduled',
      notes: notes || day.notes,
    };

    await this.programRepo.saveProgramDay(updatedDay);
    return updatedDay;
  }

  /**
   * Skips a program day.
   */
  public async skipDay(dayId: string, notes?: string): Promise<ProgramDay | null> {
    const day = await this.programRepo.getProgramDayById(dayId);
    if (!day) return null;

    const updatedDay: ProgramDay = {
      ...day,
      status: 'skipped',
      notes: notes || day.notes,
    };

    await this.programRepo.saveProgramDay(updatedDay);
    return updatedDay;
  }

  /**
   * Program execution bridge: Links a completed WorkoutSession to a ProgramDay.
   * Only links if the session completed successfully.
   */
  public async linkCompletedSession(
    programId: string,
    dayId: string,
    sessionId: string
  ): Promise<ProgramDay | null> {
    const [day, session, program] = await Promise.all([
      this.programRepo.getProgramDayById(dayId),
      this.completionRepo.getSessionById(sessionId),
      this.programRepo.getProgramById(programId),
    ]);

    if (!day || !session) return null;

    // Session resilience rule: Abandoned sessions do NOT fulfill program days
    if (session.status !== 'completed') {
      return day;
    }

    const updatedDay: ProgramDay = {
      ...day,
      status: 'completed',
      completedSessionId: session.id,
      completedAt: session.completedAt || new Date().toISOString(),
    };

    await this.programRepo.saveProgramDay(updatedDay);

    // Recheck program overall completion based only on completion-bearing workout days
    if (program) {
      const refreshedProgram = await this.programRepo.getProgramById(programId);
      if (refreshedProgram) {
        const metrics = this.calculateAdherence(refreshedProgram);
        if (metrics.isComplete && refreshedProgram.status === 'active') {
          refreshedProgram.status = 'completed';
          refreshedProgram.completedAt = new Date().toISOString();
          await this.programRepo.saveProgram(refreshedProgram);
        }
      }
    }

    return updatedDay;
  }

  /**
   * Identifies whether a program day is completion-bearing.
   * Days with type 'workout' or referencing a valid 'workoutTemplateId' require a completed WorkoutSession.
   * Pure 'rest' and 'recovery' days without workout templates do NOT block overall program completion.
   */
  public static isCompletionBearingDay(day: ProgramDay): boolean {
    return day.type === 'workout' || Boolean(day.workoutTemplateId);
  }

  /**
   * Derives current program week number dynamically from start date + schedule.
   * Avoids stale manual counter state when user resumes after time away.
   * Falls back to persisted currentWeekNumber if explicitly paused.
   */
  public static deriveCurrentWeekNumber(program: Program, asOfDate: Date = new Date()): number {
    if (!program.weeks || program.weeks.length === 0) return 1;

    // Respect paused state if program was manually paused
    if (program.status === 'paused' && program.currentWeekNumber) {
      return program.currentWeekNumber;
    }

    if (program.startDate) {
      const start = new Date(program.startDate).getTime();
      const now = asOfDate.getTime();
      if (now >= start) {
        const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        const calculatedWeek = Math.floor(diffDays / 7) + 1;
        return Math.min(program.weeks.length, Math.max(1, calculatedWeek));
      }
      return 1;
    }

    // Schedule-based fallback: first week with an uncompleted planned/rescheduled day
    for (const week of program.weeks) {
      if (week.days.some((d) => d.status === 'planned' || d.status === 'rescheduled')) {
        return week.weekNumber;
      }
    }

    return program.weeks.length;
  }

  /**
   * Derives current day number within the week (1-7).
   */
  public static deriveCurrentDayNumber(program: Program, asOfDate: Date = new Date()): number {
    if (program.startDate) {
      const start = new Date(program.startDate).getTime();
      const now = asOfDate.getTime();
      if (now >= start) {
        const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return (diffDays % 7) + 1;
      }
    }
    const currentWeekNum = this.deriveCurrentWeekNumber(program, asOfDate);
    const week = program.weeks.find((w) => w.weekNumber === currentWeekNum);
    if (week) {
      const uncompletedDay = week.days.find((d) => d.status === 'planned' || d.status === 'rescheduled');
      if (uncompletedDay) return uncompletedDay.dayNumber;
    }
    return 1;
  }

  /**
   * Pure Adherence calculation for a program.
   * Only completion-bearing workout days are evaluated for completion.
   */
  public calculateAdherence(program: Program, asOfDate: Date = new Date()): ProgramAdherenceMetrics {
    let totalDays = 0;
    let totalWorkoutDays = 0;
    let completedWorkoutDays = 0;
    let rescheduledDaysCount = 0;
    let skippedDaysCount = 0;

    for (const week of program.weeks || []) {
      for (const day of week.days || []) {
        totalDays++;
        if (ProgramService.isCompletionBearingDay(day)) {
          totalWorkoutDays++;
          if (day.status === 'completed') {
            completedWorkoutDays++;
          }
        }
        if (day.status === 'rescheduled') {
          rescheduledDaysCount++;
        }
        if (day.status === 'skipped') {
          skippedDaysCount++;
        }
      }
    }

    const adherencePercentage =
      totalWorkoutDays > 0
        ? Math.round((completedWorkoutDays / totalWorkoutDays) * 100)
        : 100;

    const isComplete =
      totalWorkoutDays > 0 && completedWorkoutDays >= totalWorkoutDays;

    return {
      totalDays,
      totalWorkoutDays,
      completedWorkoutDays,
      adherencePercentage,
      rescheduledDaysCount,
      skippedDaysCount,
      currentWeekNumber: ProgramService.deriveCurrentWeekNumber(program, asOfDate),
      currentDayNumber: ProgramService.deriveCurrentDayNumber(program, asOfDate),
      isComplete,
    };
  }

  /**
   * Finds today's scheduled program day for an active program.
   */
  public getTodaysProgramDay(
    program: Program,
    todayStr?: string
  ): { week: ProgramWeek; day: ProgramDay } | null {
    const targetStr =
      todayStr ||
      (() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      })();

    for (const week of program.weeks || []) {
      for (const day of week.days || []) {
        const targetDate = day.effectiveDate || day.scheduledDate;
        if (targetDate === targetStr) {
          return { week, day };
        }
      }
    }

    // Fallback: return the first non-completed day
    for (const week of program.weeks || []) {
      for (const day of week.days || []) {
        if (day.status === 'planned' || day.status === 'rescheduled') {
          return { week, day };
        }
      }
    }

    return null;
  }
}
