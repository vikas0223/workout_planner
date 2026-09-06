'use client';

import React, { useState } from 'react';
import { FitnessGoalTarget, GoalTargetType, GoalDirection } from '@/types/domain';
import { X, Target } from 'lucide-react';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: FitnessGoalTarget) => Promise<unknown>;
}

export function CreateGoalModal({ isOpen, onClose, onSave }: CreateGoalModalProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<GoalTargetType>('workouts_completed');
  const [direction, setDirection] = useState<GoalDirection>('increase');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [unit, setUnit] = useState('workouts');
  const [startValue, setStartValue] = useState<number>(0);
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleTypeChange = (newType: GoalTargetType) => {
    setType(newType);
    switch (newType) {
      case 'workouts_completed':
        setUnit('workouts');
        setTargetValue(10);
        break;
      case 'frequency':
        setUnit('workouts/wk');
        setTargetValue(4);
        break;
      case 'volume':
        setUnit('kg');
        setTargetValue(25000);
        break;
      case 'strength':
      case 'personal_record':
        setUnit('kg');
        setTargetValue(100);
        break;
      case 'weight':
        setUnit('kg');
        setTargetValue(75);
        break;
      default:
        setUnit('units');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValue) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const goal: FitnessGoalTarget = {
        id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type,
        direction,
        label: label.trim() || undefined,
        targetValue: Number(targetValue),
        unit,
        startValue: Number(startValue) || 0,
        startDate: now,
        targetDate: targetDate || undefined,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      await onSave(goal);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-goal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        style={{ width: 'min(calc(100vw - 32px), 560px)' }}
        className="max-h-[min(calc(100vh-32px),760px)] overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-2xl space-y-6 text-slate-800 animate-in zoom-in-95 duration-200"
      >
        {/* Header: display flex, align-items center, justify-content space-between */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Target className="h-5 w-5" />
            </span>
            <h2 id="create-goal-title" className="text-lg sm:text-xl font-bold text-slate-900">
              Set New Fitness Goal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Goal Type */}
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="goal-type-select" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Goal Type
            </label>
            <select
              id="goal-type-select"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as GoalTargetType)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            >
              <option value="workouts_completed">Workouts Completed Total</option>
              <option value="frequency">Weekly Training Frequency</option>
              <option value="volume">Accumulated Volume (Load)</option>
              <option value="strength">Strength / PR Milestone</option>
              <option value="weight">Bodyweight Target</option>
            </select>
          </div>

          {/* TWO-COLUMN ROW 1: Direction / Unit (grid-template-columns: repeat(2, minmax(0, 1fr)), gap: 16px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="goal-direction-select" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Direction
              </label>
              <select
                id="goal-direction-select"
                value={direction}
                onChange={(e) => setDirection(e.target.value as GoalDirection)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              >
                <option value="increase">Increase / Build</option>
                <option value="decrease">Decrease / Cut</option>
                <option value="maintain">Maintain</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="goal-unit-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Unit
              </label>
              <input
                id="goal-unit-input"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* TWO-COLUMN ROW 2: Start Value / Target Value (grid-template-columns: repeat(2, minmax(0, 1fr)), gap: 16px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="goal-start-value-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Start Value
              </label>
              <input
                id="goal-start-value-input"
                type="number"
                step="any"
                value={startValue}
                onChange={(e) => setStartValue(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="goal-target-value-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Target Value *
              </label>
              <input
                id="goal-target-value-input"
                type="number"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Custom Goal Label */}
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="goal-custom-label-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Custom Goal Label
            </label>
            <input
              id="goal-custom-label-input"
              type="text"
              placeholder="e.g. Hit 100kg Bench Press or 20 Workouts in March"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            />
          </div>

          {/* Target Deadline */}
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="goal-deadline-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Target Deadline (Optional)
            </label>
            <input
              id="goal-deadline-input"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            />
          </div>

          {/* Footer: Cancel and Create Goal share same vertical alignment, primary action stronger visual hierarchy */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 rounded-xl bg-slate-900 hover:bg-black active:bg-slate-950 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              {saving ? 'Saving...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
