'use client';

import React from 'react';
import { EvaluatedGoalProgress } from '@/lib/domain/goal-service';
import {
  Target,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface GoalCardProps {
  evaluatedGoal: EvaluatedGoalProgress;
  onDelete: (id: string) => Promise<unknown>;
}

export function GoalCard({ evaluatedGoal, onDelete }: GoalCardProps) {
  const { goal, currentValue, percentComplete, remaining, isAchieved, trendText } = evaluatedGoal;

  const getDirectionIcon = () => {
    switch (goal.direction) {
      case 'increase':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
      case 'decrease':
        return <TrendingDown className="h-3.5 w-3.5 text-amber-500" />;
      case 'maintain':
        return <Minus className="h-3.5 w-3.5 text-sky-500" />;
      default:
        return <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />;
    }
  };

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${
        isAchieved
          ? 'border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/30'
          : 'border-slate-200/80 bg-white hover:border-slate-300'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {getDirectionIcon()}
            <span className="capitalize text-slate-500">
              {goal.direction} {goal.type.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isAchieved ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100/80">
                <CheckCircle2 className="h-3 w-3" />
                Achieved
              </span>
            ) : (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100/80">
                {percentComplete}%
              </span>
            )}

            <button
              onClick={() => onDelete(goal.id)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Delete Goal"
              aria-label={`Delete ${goal.label || 'goal'}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Goal Title / Label */}
        <h3 className="mt-3 text-base font-bold tracking-tight text-slate-900">
          {goal.label || `${goal.targetValue} ${goal.unit} Target`}
        </h3>

        {/* Progress Value Comparison */}
        <div className="mt-2 flex items-baseline justify-between text-xs">
          <span className="text-slate-500">Current:</span>
          <span className="font-bold text-slate-800">
            {currentValue} <span className="font-normal text-slate-400">/ {goal.targetValue} {goal.unit}</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAchieved ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, percentComplete)}%` }}
          />
        </div>
      </div>

      {/* Footer Details */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span>{trendText}</span>
        {goal.targetDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
