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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md">
      {/* Header / Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Active Training Program
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100/80">
                In Progress
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">{program.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPause}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            Pause
          </button>
          <Link
            href={`/programs/${program.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            View Full Plan <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Adherence & Progress Bar */}
      {adherence && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Adherence Rate:{' '}
              <strong className="font-bold text-slate-900">
                {adherence.adherencePercentage}%
              </strong>{' '}
              ({adherence.completedWorkoutDays} of {adherence.totalWorkoutDays} workouts completed)
            </span>
            <span className="text-slate-500 font-medium">
              {program.weeks.length} Weeks Total
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${Math.min(100, adherence.adherencePercentage)}%` }}
            />
          </div>
        </div>
      )}

      {/* Today's Scheduled Assignment */}
      <div className="mt-6 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
            {todaysDay && (
              <span>
                {currentWeek?.label || `Week ${currentWeek?.weekNumber || 1}`} • Day {currentDay?.dayNumber || 1}
              </span>
            )}
          </div>
          {currentDay && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                currentDay.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80'
                  : currentDay.status === 'rescheduled'
                  ? 'bg-amber-50 text-amber-700 border border-amber-100/80'
                  : currentDay.status === 'skipped'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100/80'
              }`}
            >
              {currentDay.status}
            </span>
          )}
        </div>

        {currentDay ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentDay.label || (currentDay.type === 'workout' ? 'Scheduled Workout' : `${currentDay.type.toUpperCase()} Day`)}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Workout
                </button>
              )}

              {currentDay.status === 'completed' && (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reschedule
                  </button>

                  <button
                    onClick={() => onSkipDay(currentDay.id)}
                    title="Skip this day"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Skip
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-500">
            No scheduled day found for today.
          </div>
        )}
      </div>

      {/* Inline Reschedule Dialog */}
      {rescheduleDayId && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-3 text-xs">
          <span className="font-semibold text-slate-900">New Effective Date:</span>
          <input
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={handleConfirmReschedule}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:bg-indigo-800"
          >
            Save Date
          </button>
          <button
            onClick={() => setRescheduleDayId(null)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
