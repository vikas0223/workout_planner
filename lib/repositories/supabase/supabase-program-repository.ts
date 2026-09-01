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
    if (error || !rows) return [];

    const programs: Program[] = [];
    for (const r of rows) {
      const full = await this.getProgramById(r.id);
      if (full) programs.push(full);
    }
    return programs;
  }

  public async saveProgram(program: Program): Promise<void> {
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
      updated_at: new Date().toISOString(),
      client_updated_at: program.updatedAt,
      deleted_at: null,
    };

    await this.client.from('programs').upsert(payload);

    if (program.weeks) {
      for (const w of program.weeks) {
        await this.client.from('program_weeks').upsert({
          id: w.id,
          program_id: program.id,
          user_id: program.userId,
          week_number: w.weekNumber,
          label: w.label,
          updated_at: new Date().toISOString(),
          client_updated_at: new Date().toISOString(),
          deleted_at: null,
        });

        if (w.days) {
          for (const d of w.days) {
            await this.client.from('program_days').upsert({
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
              updated_at: new Date().toISOString(),
              client_updated_at: new Date().toISOString(),
              deleted_at: null,
            });
          }
        }
      }
    }
  }

  public async deleteProgram(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.client.from('programs').update({ deleted_at: now, updated_at: now }).eq('id', id);
  }

  public async saveProgramDay(day: ProgramDay): Promise<void> {
    const now = new Date().toISOString();
    await this.client.from('program_days').upsert({
      id: day.id,
      program_id: day.programId,
      program_week_id: day.programWeekId,
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
