/**
 * Exercise Filters Component
 * 
 * Multi-faceted filters with category counters and accessible button toggles.
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';

export interface ExerciseFiltersProps {
  selectedMuscles: string[];
  selectedEquipment: string[];
  selectedDifficulties: string[];
  selectedMovements: string[];
  selectedGoals: string[];
  onToggleMuscle: (muscle: string) => void;
  onToggleEquipment: (eq: string) => void;
  onToggleDifficulty: (diff: string) => void;
  onToggleMovement: (move: string) => void;
  onToggleGoal: (goal: string) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}

const MUSCLE_OPTIONS = [
  'Chest',
  'Back',
  'Lats',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Biceps',
  'Triceps',
  'Abs',
  'Calves',
];

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Bodyweight',
  'Kettlebell',
  'Resistance Band',
];

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];

const MOVEMENT_OPTIONS = [
  'push',
  'pull',
  'squat',
  'hinge',
  'carry',
  'rotation',
  'isolation',
  'locomotion',
];

const GOAL_OPTIONS = [
  { id: 'strength', label: 'Strength' },
  { id: 'hypertrophy', label: 'Hypertrophy' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'general_fitness', label: 'Fitness' },
  { id: 'fat_loss', label: 'Fat Loss' },
  { id: 'mobility', label: 'Mobility' },
];

export function ExerciseFilters({
  selectedMuscles,
  selectedEquipment,
  selectedDifficulties,
  selectedMovements,
  selectedGoals,
  onToggleMuscle,
  onToggleEquipment,
  onToggleDifficulty,
  onToggleMovement,
  onToggleGoal,
  onClearAll,
  activeFilterCount,
}: ExerciseFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Top Header with Clear All */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* 1. Muscle Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Target Muscle
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_OPTIONS.map((muscle) => {
            const isSelected = selectedMuscles.includes(muscle);
            return (
              <button
                key={muscle}
                type="button"
                onClick={() => onToggleMuscle(muscle)}
                aria-pressed={isSelected}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {muscle}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Equipment Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Equipment
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT_OPTIONS.map((eq) => {
            const isSelected = selectedEquipment.includes(eq);
            return (
              <button
                key={eq}
                type="button"
                onClick={() => onToggleEquipment(eq)}
                aria-pressed={isSelected}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {eq}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Difficulty Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Difficulty
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTY_OPTIONS.map((diff) => {
            const isSelected = selectedDifficulties.includes(diff);
            return (
              <button
                key={diff}
                type="button"
                onClick={() => onToggleDifficulty(diff)}
                aria-pressed={isSelected}
                className={`text-xs px-2.5 py-1 rounded-lg border capitalize transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {diff}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Movement Pattern Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Movement Pattern
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MOVEMENT_OPTIONS.map((move) => {
            const isSelected = selectedMovements.includes(move);
            return (
              <button
                key={move}
                type="button"
                onClick={() => onToggleMovement(move)}
                aria-pressed={isSelected}
                className={`text-xs px-2.5 py-1 rounded-lg border capitalize transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {move}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Fitness Goal Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Fitness Goal
        </label>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => onToggleGoal(goal.id)}
                aria-pressed={isSelected}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {goal.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
