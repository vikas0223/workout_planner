/**
 * Set Logger Component
 * 
 * High-speed, mobile-first one-handed interface for logging performed workout sets.
 * Uses pure session commands from useWorkoutSession() without duplicating validation.
 */

'use client';

import React, { useState } from 'react';
import { WorkoutSet, SetType } from '@/types/domain';
import { UpdateSetInput } from '@/features/workout-session/session-commands.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export interface SetLoggerProps {
  sessionExerciseId: string;
  loggedSets: WorkoutSet[];
  targetSetsCount?: number;
  targetRepsRange?: string | number;
  onLogSet: (input: {
    sessionExerciseId: string;
    setNumber?: number;
    actualReps?: number;
    actualWeight?: number;
    weightUnit?: 'kg' | 'lbs';
    rpe?: number;
    notes?: string;
    type?: SetType;
  }) => Promise<any>;
  onUpdateSet: (input: Omit<UpdateSetInput, 'sessionId'>) => Promise<any>;
  onDeleteSet: (sessionExerciseId: string, setId: string) => Promise<void>;
  onSetLoggedCallback?: () => void;
}

export function SetLogger({
  sessionExerciseId,
  loggedSets = [],
  targetSetsCount = 3,
  targetRepsRange = '8-12',
  onLogSet,
  onUpdateSet,
  onDeleteSet,
  onSetLoggedCallback,
}: SetLoggerProps) {
  const nextSetNumber =
    loggedSets.length > 0 ? Math.max(...loggedSets.map((s) => s.setNumber)) + 1 : 1;

  // Last logged values as convenient pre-fill
  const lastSet = loggedSets[loggedSets.length - 1];
  const [weight, setWeight] = useState<string>(
    lastSet?.actualWeight !== undefined ? String(lastSet.actualWeight) : ''
  );
  const [reps, setReps] = useState<string>(
    lastSet?.actualReps !== undefined ? String(lastSet.actualReps) : '10'
  );
  const [rpe, setRpe] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmitNewSet = async (e: React.FormEvent) => {
    e.preventDefault();
    const repsNum = parseInt(reps, 10);
    const weightNum = weight.trim() ? parseFloat(weight) : undefined;
    const rpeNum = rpe.trim() ? parseFloat(rpe) : undefined;

    if (isNaN(repsNum) || repsNum <= 0) {
      setInputError('Reps must be a positive number');
      return;
    }

    setInputError(null);
    setIsSubmitting(true);
    try {
      await onLogSet({
        sessionExerciseId,
        setNumber: nextSetNumber,
        actualReps: repsNum,
        actualWeight: weightNum,
        weightUnit: 'kg',
        rpe: rpeNum,
        notes: notes.trim() || undefined,
        type: 'working',
      });

      // Clear non-sticky fields & notify parent
      setNotes('');
      if (onSetLoggedCallback) {
        onSetLoggedCallback();
      }
    } catch (err: any) {
      setInputError(err?.message || 'Failed to log set');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Logged Sets Table / List */}
      {loggedSets.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Completed Sets ({loggedSets.length} / {targetSetsCount})</span>
            <span>Weight × Reps</span>
          </div>

          <div className="space-y-1.5">
            {loggedSets.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[11px]">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-800">Set {s.setNumber}</span>
                  {s.type && s.type !== 'working' && (
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      ({s.type})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="font-black text-slate-900 text-sm">
                    {s.actualWeight !== undefined ? `${s.actualWeight} kg` : 'Bodyweight'} ×{' '}
                    {s.actualReps || 0} reps
                    {s.rpe !== undefined && (
                      <span className="text-[11px] font-semibold text-indigo-600 ml-1.5">
                        @ RPE {s.rpe}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteSet(sessionExerciseId, s.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    aria-label={`Delete set ${s.setNumber}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Set Input Row Form */}
      <form
        onSubmit={handleSubmitNewSet}
        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
              {nextSetNumber}
            </span>
            <h4 className="text-xs font-bold text-slate-900">
              Log Set #{nextSetNumber}
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            Target: <strong className="text-slate-800">{String(targetRepsRange)} reps</strong>
          </span>
        </div>

        {/* Primary Inputs: Weight & Reps */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Weight (kg / lbs)
            </label>
            <Input
              type="number"
              step="0.5"
              placeholder="e.g. 60"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-10 text-sm font-black rounded-xl bg-white border-slate-200"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Reps Performed *
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="e.g. 10"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="h-10 text-sm font-black rounded-xl bg-white border-slate-200"
            />
          </div>

          <div className="col-span-2 sm:col-span-4 flex items-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {isSubmitting ? 'Logging...' : `Log Set #${nextSetNumber}`}
            </Button>
          </div>
        </div>

        {/* Optional Expandable Controls */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalFields((prev) => !prev)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            {showOptionalFields ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Hide Optional Fields (RPE, Notes)
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                + Add RPE / Notes
              </>
            )}
          </button>

          {showOptionalFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/60">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  RPE (Rate of Perceived Exertion 1-10)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  step="0.5"
                  placeholder="e.g. 8"
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  className="h-8 text-xs rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Notes
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Good form, slight fatigue"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-xs rounded-lg bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {inputError && <p className="text-xs text-rose-600 font-semibold">{inputError}</p>}
      </form>
    </div>
  );
}
