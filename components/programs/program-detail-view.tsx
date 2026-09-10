'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Program } from '@/types/domain';
import { ProgramService, ProgramAdherenceMetrics } from '@/lib/domain/program-service';
import { LocalProgramRepository, LocalCompletionRepository, LocalWorkoutRepository } from '@/lib/repositories/local';
import { ProgramWeekView } from './program-week-view';
import { ArrowLeft, Play, Pause, Trash2, Calendar, Target, Award, Dumbbell } from 'lucide-react';

interface ProgramDetailViewProps {
  programId: string;
}

export function ProgramDetailView({ programId }: ProgramDetailViewProps) {
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [adherence, setAdherence] = useState<ProgramAdherenceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const programRepo = useMemo(() => new LocalProgramRepository(), []);
  const workoutRepo = useMemo(() => new LocalWorkoutRepository(), []);
  const completionRepo = useMemo(() => new LocalCompletionRepository(), []);
  const service = useMemo(
    () => new ProgramService(programRepo, workoutRepo, completionRepo),
    [programRepo, workoutRepo, completionRepo]
  );

  const loadData = useCallback(async () => {
    try {
      const p = await programRepo.getProgramById(programId);
      setProgram(p);
      if (p) {
        const adh = service.calculateAdherence(p);
        setAdherence(adh);
      }
    } catch (err) {
      console.error('[ProgramDetailView] Error loading program:', err);
    } finally {
      setLoading(false);
    }
  }, [programId, programRepo, service]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRescheduleDay = async (dayId: string, newDate: string) => {
    await service.rescheduleDay(dayId, newDate);
    await loadData();
  };

  const handleSkipDay = async (dayId: string) => {
    await service.skipDay(dayId);
    await loadData();
  };

  const handleToggleActive = async () => {
    if (!program) return;
    const newStatus = program.status === 'active' ? 'paused' : 'active';
    program.status = newStatus;
    await programRepo.saveProgram(program);
    await loadData();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this training program?')) {
      await programRepo.deleteProgram(programId);
      router.push('/programs');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-xs text-slate-500 font-medium">Loading program details...</span>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">Program Not Found</h2>
        <p className="mt-2 text-xs text-slate-500">The requested program could not be loaded or has been deleted.</p>
        <Link
          href="/programs"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:bg-indigo-800"
        >
          Back to Programs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Back Navigation & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Programs
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition focus-visible:outline-none focus-visible:ring-2 ${
              program.status === 'active'
                ? 'border border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-500'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-200 focus-visible:ring-indigo-600'
            }`}
          >
            {program.status === 'active' ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                Pause Program
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Set as Active
              </>
            )}
          </button>

          <button
            onClick={handleDelete}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Delete Program"
            aria-label="Delete Program"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Program Summary Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] ${
              program.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {program.status}
          </span>
          <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-100/80 px-2.5 py-0.5 text-[10px] font-semibold capitalize">
            {program.difficulty || 'All Levels'}
          </span>
          <span className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-2.5 py-0.5 text-[10px] font-bold">
            {program.weeks.length} Weeks
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{program.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{program.description || 'Structured multi-week workout program.'}</p>
        </div>

        {adherence && (
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Adherence</span>
              <p className="mt-0.5 text-base font-bold text-slate-900">{adherence.adherencePercentage}%</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Workouts Completed</span>
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {adherence.completedWorkoutDays} / {adherence.totalWorkoutDays}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Rescheduled</span>
              <p className="mt-0.5 text-base font-bold text-slate-900">{adherence.rescheduledDaysCount} Days</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Skipped</span>
              <p className="mt-0.5 text-base font-bold text-slate-900">{adherence.skippedDaysCount} Days</p>
            </div>
          </div>
        )}
      </div>

      {/* Week-by-Week Breakdown */}
      <div className="space-y-6">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Training Schedule</h2>
        {program.weeks.map((week) => (
          <ProgramWeekView
            key={week.id}
            week={week}
            programId={program.id}
            onRescheduleDay={handleRescheduleDay}
            onSkipDay={handleSkipDay}
          />
        ))}
      </div>
    </div>
  );
}
