'use client';

import React, { useState } from 'react';
import { FitnessGoalTarget, GoalTargetType, GoalDirection } from '@/types/domain';
import { X, Target, Plus } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground">Set New Fitness Goal</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Goal Type</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as GoalTargetType)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="workouts_completed">Workouts Completed Total</option>
              <option value="frequency">Weekly Training Frequency</option>
              <option value="volume">Accumulated Volume (Load)</option>
              <option value="strength">Strength / PR Milestone</option>
              <option value="weight">Bodyweight Target</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as GoalDirection)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="increase">Increase / Build</option>
                <option value="decrease">Decrease / Cut</option>
                <option value="maintain">Maintain</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Start Value</label>
              <input
                type="number"
                step="any"
                value={startValue}
                onChange={(e) => setStartValue(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Target Value *</label>
              <input
                type="number"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Custom Goal Label</label>
            <input
              type="text"
              placeholder="e.g. Hit 100kg Bench Press or 20 Workouts in March"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Target Deadline (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
