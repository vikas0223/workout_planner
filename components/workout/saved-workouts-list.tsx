/**
 * Saved Workouts List Component
 * 
 * Displays saved workout templates from LocalWorkoutRepository (IndexedDB)
 * with Start, Edit, Duplicate, and Delete actions.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WorkoutTemplate } from '@/types/domain';
import { LocalWorkoutRepository } from '@/lib/repositories/local/local-workout-repository';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark,
  Play,
  Pencil,
  Copy,
  Trash2,
  Plus,
  Sparkles,
  Clock,
  Dumbbell,
  Target,
} from 'lucide-react';
import { generateId } from '@/lib/utils/id';

export interface SavedWorkoutsListProps {
  onStartWorkout: (template: WorkoutTemplate) => void;
  onEditWorkout: (template: WorkoutTemplate) => void;
  onCreateNew: () => void;
  onGenerateNew: () => void;
  userId?: string;
}

export function SavedWorkoutsList({
  onStartWorkout,
  onEditWorkout,
  onCreateNew,
  onGenerateNew,
  userId = 'guest_user',
}: SavedWorkoutsListProps) {
  const [repository] = useState(() => new LocalWorkoutRepository());
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await repository.listTemplates(userId);
      setTemplates(list);
    } catch (err) {
      console.error('Failed to load saved templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [repository, userId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDuplicate = async (template: WorkoutTemplate) => {
    const now = new Date().toISOString();
    const duplicated: WorkoutTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await repository.saveTemplate(duplicated);
    await loadTemplates();
  };

  const handleDelete = async (id: string) => {
    await repository.deleteTemplate(id);
    await loadTemplates();
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading saved workout routines...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            Workout Library
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Saved Routines ({templates.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your customized and saved workout templates stored locally offline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateNew}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Generate Plan
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onCreateNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs px-3.5"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Manual
          </Button>
        </div>
      </div>

      {/* Template List */}
      {templates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No saved workouts yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Generate a personalized routine or build your own custom workout template to save it here.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCreateNew}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Build Workout
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onGenerateNew}
              className="bg-indigo-600 text-white text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Generate Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">{tpl.name}</h3>
                  <Badge variant="outline" className="text-[10px] py-0 bg-slate-50 uppercase tracking-wider">
                    {tpl.goal.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {tpl.duration} mins
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
                    {tpl.exercises.length} Exercises
                  </span>
                  <span>•</span>
                  <span className="capitalize">{tpl.difficulty} Level</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditWorkout(tpl)}
                  className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600"
                  aria-label="Edit routine"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(tpl)}
                  className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600"
                  aria-label="Duplicate routine"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tpl.id)}
                  className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  aria-label="Delete routine"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => onStartWorkout(tpl)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs px-3.5 ml-1"
                >
                  <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                  Start
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
