'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Program, ProgramDay, ProgramWeek } from '@/types/domain';
import { ProgramAdherenceMetrics } from '@/lib/domain/program-service';
import {
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  SkipForward,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface ActiveProgramCardProps {
  program: Program;
  adherence: ProgramAdherenceMetrics | null;
  todaysDay: { week: ProgramWeek; day: ProgramDay } | null;
  onRescheduleDay: (dayId: string, newDateStr: string) => Promise<unknown>;
  onSkipDay: (dayId: string) => Promise<unknown>;
  onPause: () => Promise<unknown>;
}

export function ActiveProgramCard({
  program,
  adherence,
  todaysDay,
  onRescheduleDay,
  onSkipDay,
  onPause,
}: ActiveProgramCardProps) {
  const router = useRouter();
  const [rescheduleDayId, setRescheduleDayId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');

  const currentDay = todaysDay?.day;
  const currentWeek = todaysDay?.week;

  const handleStartWorkout = () => {
    if (currentDay?.workoutTemplateId) {
      router.push(`/workout/active?templateId=${encodeURIComponent(currentDay.workoutTemplateId)}&programId=${encodeURIComponent(program.id)}&programDayId=${encodeURIComponent(currentDay.id)}`);
    } else {
      router.push('/workout/active');
    }
  };

  const handleConfirmReschedule = async () => {
    if (rescheduleDayId && rescheduleDate) {
      await onRescheduleDay(rescheduleDayId, rescheduleDate);
      setRescheduleDayId(null);
      setRescheduleDate('');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
      {/* Header / Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Active Training Program
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                In Progress
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{program.name}</h2>
          </div>
        </div>

        <Link
          href={`/programs/${program.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          View Full Plan <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Adherence & Progress Bar */}
      {adherence && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Adherence Rate:{' '}
              <strong className="font-semibold text-foreground">
                {adherence.adherencePercentage}%
              </strong>{' '}
              ({adherence.completedWorkoutDays} of {adherence.totalWorkoutDays} workouts completed)
            </span>
            <span className="text-muted-foreground">
              {program.weeks.length} Weeks Total
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, adherence.adherencePercentage)}%` }}
            />
          </div>
        </div>
      )}

      {/* Today's Scheduled Assignment */}
      <div className="mt-6 rounded-xl border border-border/70 bg-background/80 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {currentWeek?.label || `Week ${currentWeek?.weekNumber || 1}`} • Day {currentDay?.dayNumber || 1}
            </span>
          </div>
          {currentDay && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                currentDay.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : currentDay.status === 'rescheduled'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : currentDay.status === 'skipped'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {currentDay.status}
            </span>
          )}
        </div>

        {currentDay ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {currentDay.label || (currentDay.type === 'workout' ? 'Scheduled Workout' : `${currentDay.type.toUpperCase()} Day`)}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {currentDay.type === 'workout'
                  ? 'Follow your planned progressive overload routine.'
                  : currentDay.type === 'rest'
                  ? 'Rest and muscle recovery day. Stay hydrated.'
                  : currentDay.type === 'mobility'
                  ? 'Light stretching, joint mobility, and posture work.'
                  : 'Active recovery: walking, swimming, or easy cycling.'}
              </p>
            </div>

            {/* Actions for Today */}
            <div className="flex items-center gap-2">
              {currentDay.type === 'workout' && currentDay.status !== 'completed' && (
                <button
                  onClick={handleStartWorkout}
                  id="btn-start-program-workout"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Workout
                </button>
              )}

              {currentDay.status === 'completed' && (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </div>
              )}

              {currentDay.status !== 'completed' && (
                <>
                  <button
                    onClick={() => {
                      setRescheduleDayId(currentDay.id);
                      setRescheduleDate(currentDay.effectiveDate || currentDay.scheduledDate || '');
                    }}
                    title="Reschedule this day"
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reschedule
                  </button>

                  <button
                    onClick={() => onSkipDay(currentDay.id)}
                    title="Skip this day"
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Skip
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-muted-foreground">
            No scheduled day found for today.
          </div>
        )}
      </div>

      {/* Inline Reschedule Dialog */}
      {rescheduleDayId && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
          <span className="font-medium text-foreground">New Effective Date:</span>
          <input
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleConfirmReschedule}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Save Date
          </button>
          <button
            onClick={() => setRescheduleDayId(null)}
            className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
