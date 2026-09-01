/**
 * Workout Generation Review Component
 * 
 * Displays the immutable GeneratedWorkout result for inspection before starting,
 * editing in WorkoutBuilder, saving to templates, or regenerating.
 */

'use client';

import React from 'react';
import { GeneratedWorkout } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Play,
  Pencil,
  Bookmark,
  RotateCcw,
  Clock,
  Target,
  Dumbbell,
  Layers,
  Info,
} from 'lucide-react';

export interface WorkoutReviewProps {
  workout: GeneratedWorkout;
  onStart: (workout: GeneratedWorkout) => void;
  onEdit: (workout: GeneratedWorkout) => void;
  onSaveTemplate: (workout: GeneratedWorkout) => void;
  onRegenerate: () => void;
  isSaving?: boolean;
}

export function WorkoutReview({
  workout,
  onStart,
  onEdit,
  onSaveTemplate,
  onRegenerate,
  isSaving,
}: WorkoutReviewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-indigo-500/40 text-indigo-100 border-indigo-400/30 text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-200" />
              Generated Plan
            </Badge>
            <span className="text-xs text-indigo-200 font-medium capitalize">
              • {workout.difficulty} Level
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{workout.name}</h2>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-indigo-700/50 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-300 shrink-0" />
              <div>
                <span className="text-indigo-300 block text-[10px] uppercase font-semibold">Duration</span>
                <span className="font-bold">{workout.duration} Mins</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-300 shrink-0" />
              <div>
                <span className="text-indigo-300 block text-[10px] uppercase font-semibold">Goal</span>
                <span className="font-bold capitalize">{workout.goal.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-300 shrink-0" />
              <div>
                <span className="text-indigo-300 block text-[10px] uppercase font-semibold">Target</span>
                <span className="font-bold truncate max-w-[110px] block">{workout.targetMuscles.join(', ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-indigo-300 shrink-0" />
              <div>
                <span className="text-indigo-300 block text-[10px] uppercase font-semibold">Exercises</span>
                <span className="font-bold">{workout.exercises.length} Movements</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Regenerate
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(workout)}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit in Builder
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={() => onSaveTemplate(workout)}
            className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1" />
            Save as Template
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onStart(workout)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 px-4"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Start Workout
          </Button>
        </div>
      </div>

      {/* Exercise Breakdown List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          <span>Prescribed Exercises ({workout.exercises.length})</span>
          <span>Prescription</span>
        </div>

        <div className="space-y-3">
          {workout.exercises.map((ex, index) => (
            <div
              key={ex.id || `${ex.exerciseId}_${index}`}
              className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
            >
              <div className="flex items-start gap-3.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{ex.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
                    <Badge variant="outline" className="text-[10px] py-0 bg-slate-50 text-slate-700">
                      {ex.targetMuscles[0] || 'Full Body'}
                    </Badge>
                    {ex.equipment[0] && (
                      <span className="text-[11px] text-slate-500">• {ex.equipment[0]}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Prescription Badges */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sets</span>
                  <span className="text-xs font-black text-slate-800">{ex.sets}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reps</span>
                  <span className="text-xs font-black text-slate-800">{ex.reps}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rest</span>
                  <span className="text-xs font-black text-slate-800">{ex.rest}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
