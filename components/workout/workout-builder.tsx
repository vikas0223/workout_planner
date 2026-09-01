/**
 * Workout Builder Component
 * 
 * Interactive builder for creating manual workouts or editing generated plans.
 * Uses in-memory WorkoutDraft state, validates via pure domain rules,
 * and saves to LocalWorkoutRepository (IndexedDB) or starts an active session.
 */

'use client';

import React, { useState } from 'react';
import { Exercise, FitnessGoal, WorkoutTemplate } from '@/types/domain';
import {
  WorkoutDraft,
  WorkoutDraftExercise,
  validateWorkoutDraft,
  CANONICAL_GOALS,
  draftToWorkoutTemplate,
} from '@/lib/domain/workout-draft';
import { ExercisePickerModal } from './exercise-picker-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Play,
  Pencil,
  AlertTriangle,
  Dumbbell,
  Clock,
  Target,
} from 'lucide-react';
import { generateId } from '@/lib/utils/id';

export interface WorkoutBuilderProps {
  initialDraft: WorkoutDraft;
  onSaveTemplate: (template: WorkoutTemplate) => Promise<void>;
  onStartSession: (draft: WorkoutDraft) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function WorkoutBuilder({
  initialDraft,
  onSaveTemplate,
  onStartSession,
  onCancel,
  isSaving,
}: WorkoutBuilderProps) {
  const [draft, setDraft] = useState<WorkoutDraft>(initialDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  const updateDraftField = <K extends keyof WorkoutDraft>(key: K, value: WorkoutDraft[K]) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
      isDirty: true,
    }));
  };

  const updateExerciseField = (
    index: number,
    field: keyof WorkoutDraftExercise,
    value: any
  ) => {
    const updatedExercises = [...draft.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setDraft((prev) => ({
      ...prev,
      exercises: updatedExercises,
      isDirty: true,
    }));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draft.exercises.length) return;

    const updated = [...draft.exercises];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Normalize order index
    const normalized = updated.map((ex, idx) => ({ ...ex, order: idx }));

    setDraft((prev) => ({
      ...prev,
      exercises: normalized,
      isDirty: true,
    }));
  };

  const removeExercise = (index: number) => {
    const updated = draft.exercises
      .filter((_, idx) => idx !== index)
      .map((ex, idx) => ({ ...ex, order: idx }));

    setDraft((prev) => ({
      ...prev,
      exercises: updated,
      isDirty: true,
    }));
  };

  const handleOpenPickerForAdd = () => {
    setReplacingIndex(null);
    setIsPickerOpen(true);
  };

  const handleOpenPickerForReplace = (index: number) => {
    setReplacingIndex(index);
    setIsPickerOpen(true);
  };

  const handleSelectExerciseFromPicker = (exercise: Exercise) => {
    if (replacingIndex !== null && replacingIndex >= 0) {
      // Replace existing exercise while retaining prescribed sets if appropriate
      const existing = draft.exercises[replacingIndex];
      const updated = [...draft.exercises];
      updated[replacingIndex] = {
        ...existing,
        exerciseId: exercise.id,
        name: exercise.name,
        targetMuscles: exercise.primaryMuscles,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
      };
      setDraft((prev) => ({ ...prev, exercises: updated, isDirty: true }));
    } else {
      // Add new exercise to draft
      const newEx: WorkoutDraftExercise = {
        id: generateId(),
        exerciseId: exercise.id,
        name: exercise.name,
        sets: exercise.defaultSets || 3,
        reps: String(exercise.defaultReps || '8-12'),
        rest: exercise.defaultRestSeconds ? `${exercise.defaultRestSeconds}s` : '90s',
        targetMuscles: exercise.primaryMuscles,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        order: draft.exercises.length,
      };
      setDraft((prev) => ({
        ...prev,
        exercises: [...prev.exercises, newEx],
        isDirty: true,
      }));
    }
  };

  const handleSave = async () => {
    const validation = validateWorkoutDraft(draft);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    const template = draftToWorkoutTemplate(draft);
    await onSaveTemplate(template);
  };

  const handleStart = async () => {
    const validation = validateWorkoutDraft(draft);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    await onStartSession(draft);
  };

  const handleAttemptCancel = () => {
    if (draft.isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header & Meta Settings */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Workout Builder
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {draft.id ? 'Edit Workout Template' : 'Create Custom Routine'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAttemptCancel}
              className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={handleSave}
              className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save Template
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleStart}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 px-4"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              Start Workout
            </Button>
          </div>
        </div>

        {/* Global Workout Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700">Workout Name</label>
            <Input
              type="text"
              value={draft.name}
              onChange={(e) => updateDraftField('name', e.target.value)}
              placeholder="e.g. Upper Body Hypertrophy Focus"
              className="h-10 text-sm font-semibold rounded-xl bg-slate-50 border-slate-200"
            />
            {errors.name && <p className="text-[11px] text-rose-600">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Estimated Duration (mins)</label>
            <Input
              type="number"
              value={draft.duration}
              onChange={(e) => updateDraftField('duration', parseInt(e.target.value, 10) || 0)}
              className="h-10 text-sm font-semibold rounded-xl bg-slate-50 border-slate-200"
            />
            {errors.duration && <p className="text-[11px] text-rose-600">{errors.duration}</p>}
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-bold text-slate-700">Fitness Goal</label>
            <select
              value={draft.goal}
              onChange={(e) => updateDraftField('goal', e.target.value as FitnessGoal)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
            >
              {CANONICAL_GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            {errors.goal && <p className="text-[11px] text-rose-600">{errors.goal}</p>}
          </div>
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Exercises ({draft.exercises.length})
            </h3>
            {errors.exercises && (
              <span className="text-xs text-rose-600 font-semibold">• {errors.exercises}</span>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenPickerForAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs px-3.5 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Exercise
          </Button>
        </div>

        {/* Empty State */}
        {draft.exercises.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No exercises added yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Tap the &quot;Add Exercise&quot; button to select movements from the catalog or visual anatomy map.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleOpenPickerForAdd}
              className="mt-4 bg-indigo-600 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add First Exercise
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {draft.exercises.map((ex, index) => (
              <div
                key={ex.id || `${ex.exerciseId}_${index}`}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 transition-all hover:border-slate-300"
              >
                {/* Exercise Row Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveExercise(index, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        aria-label="Move exercise up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === draft.exercises.length - 1}
                        onClick={() => moveExercise(index, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        aria-label="Move exercise down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-600">#{index + 1}</span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{ex.name}</h4>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] py-0 bg-slate-50 text-slate-600">
                          {ex.targetMuscles[0] || 'Target'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Replace & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPickerForReplace(index)}
                      className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600"
                      aria-label="Replace exercise"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                      className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      aria-label="Remove exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Inline Prescription Inputs */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Sets
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={ex.sets}
                      onChange={(e) =>
                        updateExerciseField(index, 'sets', parseInt(e.target.value, 10) || 1)
                      }
                      className="h-8 text-xs font-semibold rounded-lg bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Reps
                    </label>
                    <Input
                      type="text"
                      value={ex.reps}
                      onChange={(e) => updateExerciseField(index, 'reps', e.target.value)}
                      placeholder="e.g. 8-12"
                      className="h-8 text-xs font-semibold rounded-lg bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Rest
                    </label>
                    <Input
                      type="text"
                      value={ex.rest}
                      onChange={(e) => updateExerciseField(index, 'rest', e.target.value)}
                      placeholder="e.g. 90s"
                      className="h-8 text-xs font-semibold rounded-lg bg-slate-50"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Notes (Optional)
                    </label>
                    <Input
                      type="text"
                      value={ex.notes || ''}
                      onChange={(e) => updateExerciseField(index, 'notes', e.target.value)}
                      placeholder="e.g. Focus on tempo"
                      className="h-8 text-xs rounded-lg bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Picker Dialog */}
      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectExercise={handleSelectExerciseFromPicker}
        replacingExerciseName={
          replacingIndex !== null && draft.exercises[replacingIndex]
            ? draft.exercises[replacingIndex].name
            : undefined
        }
      />

      {/* Discard Changes Dialog */}
      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Discard Unsaved Changes?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 mt-2">
            You have unsaved changes to this workout. Leaving now will discard your edits.
          </p>
          <DialogFooter className="mt-5 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDiscardConfirm(false)}
              className="text-xs"
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setShowDiscardConfirm(false);
                onCancel();
              }}
              className="text-xs"
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
