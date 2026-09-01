/**
 * Supabase Cloud Program Repository
 * Implements ProgramRepository using Supabase PostgreSQL with RLS.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ProgramRepository } from '../interfaces';
import { Program, ProgramWeek, ProgramDay } from '@/types/domain';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export class SupabaseProgramRepository implements ProgramRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getBrowserSupabaseClient();
  }

  public async getProgramById(id: string): Promise<Program | null> {
    const { data: programRow, error: pErr } = await this.client
      .from('programs')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (pErr || !programRow) return null;

    const { data: weekRows } = await this.client
      .from('program_weeks')
      .select('*')
      .eq('program_id', id)
      .is('deleted_at', null)
      .order('week_number', { ascending: true });

    const { data: dayRows } = await this.client
      .from('program_days')
      .select('*')
      .eq('program_id', id)
      .is('deleted_at', null)
      .order('day_number', { ascending: true });

    const weeks: ProgramWeek[] = (weekRows || []).map((w: any) => {
      const days: ProgramDay[] = (dayRows || [])
        .filter((d: any) => d.program_week_id === w.id)
        .map((d: any) => ({
          id: d.id,
          programId: d.program_id,
          programWeekId: d.program_week_id,
          dayNumber: d.day_number,
          type: d.type,
          label: d.label || undefined,
          workoutTemplateId: d.workout_template_id || undefined,
          status: d.status,
          scheduledDate: d.scheduled_date || undefined,
          effectiveDate: d.effective_date || undefined,
          completedSessionId: d.completed_session_id || undefined,
          completedAt: d.completed_at || undefined,
          notes: d.notes || undefined,
        }));

      return {
        id: w.id,
        programId: w.program_id,
        weekNumber: w.week_number,
        label: w.label || undefined,
        days,
      };
    });

    return {
      id: programRow.id,
      userId: programRow.user_id,
      name: programRow.name,
      description: programRow.description || undefined,
      goal: programRow.goal || undefined,
      difficulty: programRow.difficulty || undefined,
      status: programRow.status,
      startDate: programRow.start_date || undefined,
      completedAt: programRow.completed_at || undefined,
      currentWeekNumber: programRow.current_week_number || undefined,
      currentDayNumber: programRow.current_day_number || undefined,
      isCustom: programRow.is_custom || false,
      weeks,
      createdAt: programRow.created_at,
      updatedAt: programRow.updated_at,
    };
  }

  public async getActiveProgram(userId?: string): Promise<Program | null> {
    const all = await this.listPrograms(userId);
    return all.find((p) => p.status === 'active') || null;
  }

  public async listPrograms(userId?: string): Promise<Program[]> {
    let query = this.client
      .from('programs')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: rows, error } = await query;
    if (error || !rows || rows.length === 0) return [];

    const programIds = rows.map((r: any) => r.id);

    // Batch fetch related weeks and days
    const [{ data: weekRows }, { data: dayRows }] = await Promise.all([
      this.client
        .from('program_weeks')
        .select('*')
        .in('program_id', programIds)
        .is('deleted_at', null)
        .order('week_number', { ascending: true }),
      this.client
        .from('program_days')
        .select('*')
        .in('program_id', programIds)
        .is('deleted_at', null)
        .order('day_number', { ascending: true }),
    ]);

    const weeksByProgramId = new Map<string, any[]>();
    for (const w of weekRows || []) {
      const list = weeksByProgramId.get(w.program_id) || [];
      list.push(w);
      weeksByProgramId.set(w.program_id, list);
    }

    const daysByWeekId = new Map<string, any[]>();
    for (const d of dayRows || []) {
      const list = daysByWeekId.get(d.program_week_id) || [];
      list.push(d);
      daysByWeekId.set(d.program_week_id, list);
    }

    return rows.map((row: any) => {
      const pWeeks = (weeksByProgramId.get(row.id) || []).map((w: any) => {
        const pDays = (daysByWeekId.get(w.id) || []).map((d: any) => ({
          id: d.id,
          programId: d.program_id,
          programWeekId: d.program_week_id,
          dayNumber: d.day_number,
          type: d.type,
          label: d.label || undefined,
          workoutTemplateId: d.workout_template_id || undefined,
          status: d.status,
          scheduledDate: d.scheduled_date || undefined,
          effectiveDate: d.effective_date || undefined,
          completedSessionId: d.completed_session_id || undefined,
          completedAt: d.completed_at || undefined,
          notes: d.notes || undefined,
        }));

        return {
          id: w.id,
          programId: w.program_id,
          weekNumber: w.week_number,
          label: w.label || undefined,
          days: pDays,
        };
      });

      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description || undefined,
        goal: row.goal || undefined,
        difficulty: row.difficulty || undefined,
        weeks: pWeeks,
        status: row.status,
        startDate: row.start_date || undefined,
        completedAt: row.completed_at || undefined,
        currentWeekNumber: row.current_week_number || 1,
        currentDayNumber: row.current_day_number || 1,
        isCustom: row.is_custom || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  public async saveProgram(program: Program): Promise<void> {
    const now = new Date().toISOString();
    const payload = {
      id: program.id,
      user_id: program.userId,
      name: program.name,
      description: program.description,
      goal: program.goal,
      difficulty: program.difficulty,
      status: program.status,
      start_date: program.startDate,
      completed_at: program.completedAt,
      current_week_number: program.currentWeekNumber || 1,
      current_day_number: program.currentDayNumber || 1,
      is_custom: program.isCustom || false,
      updated_at: now,
      client_updated_at: program.updatedAt || now,
      deleted_at: null,
    };

    const { error: progError } = await this.client.from('programs').upsert(payload);
    if (progError) {
      console.error('[SupabaseProgramRepository] Failed to save program:', progError);
      throw progError;
    }

    if (program.weeks && program.weeks.length > 0) {
      const weekRows: any[] = [];
      const dayRows: any[] = [];

      for (const w of program.weeks) {
        weekRows.push({
          id: w.id,
          program_id: program.id,
          user_id: program.userId,
          week_number: w.weekNumber,
          label: w.label,
          updated_at: now,
          client_updated_at: now,
          deleted_at: null,
        });

        if (w.days && w.days.length > 0) {
          for (const d of w.days) {
            dayRows.push({
              id: d.id,
              program_id: program.id,
              program_week_id: w.id,
              user_id: program.userId,
              day_number: d.dayNumber,
              type: d.type,
              label: d.label,
              workout_template_id: d.workoutTemplateId || null,
              status: d.status,
              scheduled_date: d.scheduledDate,
              effective_date: d.effectiveDate,
              completed_session_id: d.completedSessionId || null,
              completed_at: d.completedAt,
              notes: d.notes,
              updated_at: now,
              client_updated_at: now,
              deleted_at: null,
            });
          }
        }
      }

      // 2. Reconcile persisted weeks and days: soft-delete remote rows absent in incoming program
      const { data: existingWeeks, error: exWeekErr } = await this.client
        .from('program_weeks')
        .select('id')
        .eq('program_id', program.id)
        .is('deleted_at', null);
      if (exWeekErr) throw exWeekErr;

      const incomingWeekIds = new Set((program.weeks || []).map((w) => w.id));
      const removedWeekIds = (existingWeeks || [])
        .map((w: { id: string }) => w.id)
        .filter((id: string) => !incomingWeekIds.has(id));

      if (removedWeekIds.length > 0) {
        const { error: delWeekError } = await this.client
          .from('program_weeks')
          .update({ deleted_at: now, updated_at: now })
          .in('id', removedWeekIds);
        if (delWeekError) throw delWeekError;
      }

      const { data: existingDays, error: exDayErr } = await this.client
        .from('program_days')
        .select('id')
        .eq('program_id', program.id)
        .is('deleted_at', null);
      if (exDayErr) throw exDayErr;

      const incomingDayIds = new Set(
        (program.weeks || []).flatMap((w) => (w.days || []).map((d) => d.id))
      );
      const removedDayIds = (existingDays || [])
        .map((d: { id: string }) => d.id)
        .filter((id: string) => !incomingDayIds.has(id));

      if (removedDayIds.length > 0) {
        const { error: delDayError } = await this.client
          .from('program_days')
          .update({ deleted_at: now, updated_at: now })
          .in('id', removedDayIds);
        if (delDayError) throw delDayError;
      }

      if (weekRows.length > 0) {
        const { error: weekError } = await this.client.from('program_weeks').upsert(weekRows);
        if (weekError) throw weekError;
      }
      if (dayRows.length > 0) {
        const { error: dayError } = await this.client.from('program_days').upsert(dayRows);
        if (dayError) throw dayError;
      }
    }
  }

  public async deleteProgram(id: string): Promise<void> {
    const now = new Date().toISOString();
    const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
      this.client.from('programs').update({ deleted_at: now, updated_at: now }).eq('id', id),
      this.client.from('program_weeks').update({ deleted_at: now, updated_at: now }).eq('program_id', id),
      this.client.from('program_days').update({ deleted_at: now, updated_at: now }).eq('program_id', id),
    ]);
    const err = e1 || e2 || e3;
    if (err) {
      console.error('[SupabaseProgramRepository] Error deleting program hierarchy:', err);
      throw err;
    }
  }

  public async saveProgramDay(day: ProgramDay): Promise<void> {
    const now = new Date().toISOString();
    const { data: parent } = await this.client
      .from('programs')
      .select('user_id')
      .eq('id', day.programId)
      .maybeSingle();

    const { error } = await this.client.from('program_days').upsert({
      id: day.id,
      program_id: day.programId,
      program_week_id: day.programWeekId,
      user_id: parent?.user_id,
      day_number: day.dayNumber,
      type: day.type,
      label: day.label,
      workout_template_id: day.workoutTemplateId || null,
      status: day.status,
      scheduled_date: day.scheduledDate,
      effective_date: day.effectiveDate,
      completed_session_id: day.completedSessionId || null,
      completed_at: day.completedAt,
      notes: day.notes,
      updated_at: now,
      client_updated_at: now,
      deleted_at: null,
    });

    if (error) {
      console.error('[SupabaseProgramRepository] Failed to save program day:', error);
      throw error;
    }
  }

  public async getProgramDayById(id: string): Promise<ProgramDay | null> {
    const { data: d, error } = await this.client
      .from('program_days')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !d) return null;

    return {
      id: d.id,
      programId: d.program_id,
      programWeekId: d.program_week_id,
      dayNumber: d.day_number,
      type: d.type,
      label: d.label || undefined,
      workoutTemplateId: d.workout_template_id || undefined,
      status: d.status,
      scheduledDate: d.scheduled_date || undefined,
      effectiveDate: d.effective_date || undefined,
      completedSessionId: d.completed_session_id || undefined,
      completedAt: d.completed_at || undefined,
      notes: d.notes || undefined,
    };
  }
}
