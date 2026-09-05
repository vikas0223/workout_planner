/**
 * Exercise Card Component
 * 
 * Compact, responsive card for exercise browsing.
 * Includes thumbnail, badges, accessible favorite toggle, and detail opener.
 */

'use client';

import React from 'react';
import { Exercise } from '@/types/domain';
import { Heart, Plus, Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExerciseMedia } from './exercise-media';

export interface ExerciseCardProps {
  exercise: Exercise;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  onSelect: (exercise: Exercise) => void;
  onAddToWorkout?: (exercise: Exercise) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  advanced: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function ExerciseCard({
  exercise,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onAddToWorkout,
}: ExerciseCardProps) {
  const diffClass = DIFFICULTY_COLORS[exercise.difficulty.toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200';
  const primaryMuscle = exercise.primaryMuscles[0] || 'Full Body';
  const primaryEquipment = exercise.equipment[0] || 'Bodyweight';

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={() => onSelect(exercise)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(exercise);
        }
      }}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      aria-label={`${exercise.name}, ${primaryMuscle}, ${exercise.difficulty}`}
    >
      <div>
        {/* Top Header: Equipment & Favorite */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-xs font-normal text-slate-600 bg-slate-50 border-slate-200 flex items-center gap-1">
            <Dumbbell className="w-3 h-3 text-slate-500" />
            <span>{primaryEquipment}</span>
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(exercise.id);
            }}
            aria-label={isFavorite ? `Remove ${exercise.name} from favorites` : `Add ${exercise.name} to favorites`}
            aria-pressed={isFavorite}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
              }`}
            />
          </Button>
        </div>

        {/* Exercise Media Demonstration */}
        <div className="mb-3">
          <ExerciseMedia exercise={exercise} context="card" />
        </div>

        {/* Exercise Title */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {exercise.name}
        </h3>

        {/* Badges: Primary Muscle & Difficulty */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 text-xs font-medium">
            {primaryMuscle}
          </Badge>
          <Badge className={`${diffClass} text-xs font-medium capitalize border`}>
            {exercise.difficulty}
          </Badge>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{exercise.defaultSets || 3} sets • {exercise.defaultReps || '10-12'}</span>
        
        {onAddToWorkout && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWorkout(exercise);
            }}
            aria-label={`Add ${exercise.name} to workout`}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
