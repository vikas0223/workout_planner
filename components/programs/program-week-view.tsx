'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgramWeek, ProgramDay } from '@/types/domain';
import {
  Calendar,
  Dumbbell,
  Moon,
  Sparkles,
  Heart,
  CheckCircle2,
  RotateCcw,
  SkipForward,
  Play,
} from 'lucide-react';

interface ProgramWeekViewProps {
  week: ProgramWeek;
  programId: string;
  onRescheduleDay: (dayId: string, newDate: string) => Promise<unknown>;
  onSkipDay: (dayId: string) => Promise<unknown>;
}

export function ProgramWeekView({
  week,
  programId,
  onRescheduleDay,
  onSkipDay,
}: ProgramWeekViewProps) {
  const router = useRouter();
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [newDateStr, setNewDateStr] = useState<string>('');

  const getDayIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return <Dumbbell className="h-4 w-4 text-primary" />;
      case 'rest':
        return <Moon className="h-4 w-4 text-sky-500" />;
      case 'mobility':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'recovery':
        return <Heart className="h-4 w-4 text-rose-500" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleStartDayWorkout = (day: ProgramDay) => {
    if (day.workoutTemplateId) {
      router.push(
        `/workout/active?templateId=${encodeURIComponent(
          day.workoutTemplateId
        )}&programId=${encodeURIComponent(programId)}&programDayId=${encodeURIComponent(day.id)}`
      );
    } else {
      router.push('/workout/active');
    }
  };

  const handleSaveReschedule = async (dayId: string) => {
    if (newDateStr) {
      await onRescheduleDay(dayId, newDateStr);
      setEditingDayId(null);
      setNewDateStr('');
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">
          {week.label || `Week ${week.weekNumber}`}
        </h3>
        <span className="text-xs text-muted-foreground">
          {week.days.filter((d) => d.type === 'workout').length} Workouts Planned
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {week.days.map((day) => {
          const isCompleted = day.status === 'completed';
          const isRescheduled = day.status === 'rescheduled';
          const isSkipped = day.status === 'skipped';
          const displayDate = day.effectiveDate || day.scheduledDate;

          return (
            <div
              key={day.id}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                isCompleted
                  ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10'
                  : isRescheduled
                  ? 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10'
                  : isSkipped
                  ? 'border-border/50 bg-muted/30 opacity-70'
                  : 'border-border bg-background'
              }`}
            >
              <div>
                {/* Top status bar */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    {getDayIcon(day.type)}
                    <span>Day {day.dayNumber}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isRescheduled
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : isSkipped
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {day.status}
                  </span>
                </div>

                {/* Day title & date */}
                <div className="mt-2.5">
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                    {day.label || (day.type === 'workout' ? 'Workout' : `${day.type.toUpperCase()} Day`)}
                  </h4>
                  {displayDate && (
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{displayDate}</span>
                      {isRescheduled && day.scheduledDate && (
                        <span className="line-through text-muted-foreground/60">
                          ({day.scheduledDate})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-border/50">
                {isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completed
                  </div>
                ) : editingDayId === day.id ? (
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={newDateStr}
                      onChange={(e) => setNewDateStr(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSaveReschedule(day.id)}
                        className="flex-1 rounded-lg bg-primary py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDayId(null)}
                        className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1">
                    {day.type === 'workout' ? (
                      <button
                        onClick={() => handleStartDayWorkout(day)}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Start
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground capitalize">
                        {day.type}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDayId(day.id);
                          setNewDateStr(day.effectiveDate || day.scheduledDate || '');
                        }}
                        title="Reschedule day"
                        className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onSkipDay(day.id)}
                        title="Skip day"
                        className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
