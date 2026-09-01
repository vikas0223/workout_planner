'use client';

import React, { useState, useEffect } from 'react';
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

  const programRepo = new LocalProgramRepository();
  const workoutRepo = new LocalWorkoutRepository();
  const completionRepo = new LocalCompletionRepository();
  const service = new ProgramService(programRepo, workoutRepo, completionRepo);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [programId]);

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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Loading program details...</span>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h2 className="text-xl font-bold text-foreground">Program Not Found</h2>
        <p className="mt-2 text-xs text-muted-foreground">The requested program could not be loaded or has been deleted.</p>
        <Link
          href="/programs"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Programs
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition ${
              program.status === 'active'
                ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white dark:text-amber-400'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
            className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
            title="Delete Program"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Program Summary Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wider ${
              program.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {program.status}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground capitalize">
            {program.difficulty || 'All Levels'}
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
            {program.weeks.length} Weeks
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{program.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{program.description || 'Structured multi-week workout program.'}</p>
        </div>

        {adherence && (
          <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4 sm:grid-cols-4 text-xs">
            <div>
              <span className="text-muted-foreground">Adherence</span>
              <p className="mt-0.5 text-base font-bold text-foreground">{adherence.adherencePercentage}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Workouts Completed</span>
              <p className="mt-0.5 text-base font-bold text-foreground">
                {adherence.completedWorkoutDays} / {adherence.totalWorkoutDays}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Rescheduled</span>
              <p className="mt-0.5 text-base font-bold text-foreground">{adherence.rescheduledDaysCount} Days</p>
            </div>
            <div>
              <span className="text-muted-foreground">Skipped</span>
              <p className="mt-0.5 text-base font-bold text-foreground">{adherence.skippedDaysCount} Days</p>
            </div>
          </div>
        )}
      </div>

      {/* Week-by-Week Breakdown */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Training Schedule</h2>
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
