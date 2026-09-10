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
        return <Dumbbell className="h-4 w-4 text-indigo-600" />;
      case 'rest':
        return <Moon className="h-4 w-4 text-sky-500" />;
      case 'mobility':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'recovery':
        return <Heart className="h-4 w-4 text-rose-500" />;
      default:
        return <Calendar className="h-4 w-4 text-slate-400" />;
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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          {week.label || `Week ${week.weekNumber}`}
        </h3>
        <span className="text-xs text-slate-500 font-medium">
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
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : isRescheduled
                  ? 'border-amber-200 bg-amber-50/40'
                  : isSkipped
                  ? 'border-slate-200/60 bg-slate-50/50 opacity-70'
                  : 'border-slate-200/80 bg-white'
              }`}
            >
              <div>
                {/* Top status bar */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                    {getDayIcon(day.type)}
                    <span>Day {day.dayNumber}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80'
                        : isRescheduled
                        ? 'bg-amber-50 text-amber-700 border border-amber-100/80'
                        : isSkipped
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100/80'
                    }`}
                  >
                    {day.status}
                  </span>
                </div>

                {/* Day title & date */}
                <div className="mt-2.5">
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {day.label || (day.type === 'workout' ? 'Workout' : `${day.type.toUpperCase()} Day`)}
                  </h4>
                  {displayDate && (
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar className="h-3 w-3 text-indigo-600" />
                      <span>{displayDate}</span>
                      {isRescheduled && day.scheduledDate && (
                        <span className="line-through text-slate-400">
                          ({day.scheduledDate})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Completed
                  </div>
                ) : editingDayId === day.id ? (
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={newDateStr}
                      onChange={(e) => setNewDateStr(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSaveReschedule(day.id)}
                        className="flex-1 rounded-lg bg-indigo-600 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDayId(null)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
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
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60 transition hover:bg-indigo-600 hover:text-white"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Start
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 capitalize">
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
                        aria-label={`Reschedule Day ${day.dayNumber}`}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onSkipDay(day.id)}
                        title="Skip day"
                        aria-label={`Skip Day ${day.dayNumber}`}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
