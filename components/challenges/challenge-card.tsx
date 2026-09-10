'use client';

import React, { useState } from 'react';
import { EvaluatedChallengeProgress } from '@/lib/domain/challenge-service';
import {
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
} from 'lucide-react';

interface ChallengeCardProps {
  evaluated: EvaluatedChallengeProgress;
  onJoin: (id: string) => Promise<unknown>;
  onLeave: (id: string) => Promise<unknown>;
}

export function ChallengeCard({ evaluated, onJoin, onLeave }: ChallengeCardProps) {
  const {
    challenge,
    isJoined,
    currentValue,
    percentComplete,
    isCompleted,
    daysRemaining,
    statusLabel,
  } = evaluated;

  const [loading, setLoading] = useState(false);

  const handleToggleJoin = async () => {
    setLoading(true);
    try {
      if (isJoined) {
        await onLeave(challenge.id);
      } else {
        await onJoin(challenge.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${
        isCompleted
          ? 'border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/30'
          : isJoined
          ? 'border-indigo-200/80 bg-gradient-to-br from-white via-white to-indigo-50/20'
          : 'border-slate-200/80 bg-white hover:border-slate-300'
      }`}
    >
      <div>
        {/* Top Meta Tags */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Flame className="h-3.5 w-3.5 text-indigo-600" />
            <span className="capitalize">{challenge.type.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isCompleted ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100/80">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            ) : isJoined ? (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100/80">
                Joined
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                <Clock className="h-3 w-3" />
                {daysRemaining}d left
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mt-3 text-base font-bold tracking-tight text-slate-900">{challenge.name}</h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
          {challenge.description || `Reach ${challenge.targetValue} ${challenge.unit} to complete this challenge.`}
        </p>

        {/* Progress Display (if joined or completed) */}
        {isJoined && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Progress:</span>
              <span className="font-bold text-slate-800">{statusLabel}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-[11px] text-slate-500">
          Goal: <strong className="font-semibold text-slate-800">{challenge.targetValue} {challenge.unit}</strong>
        </div>

        {isCompleted ? (
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <Trophy className="h-4 w-4 text-emerald-600" />
            Reward Earned
          </div>
        ) : (
          <button
            onClick={handleToggleJoin}
            disabled={loading}
            id={`btn-challenge-${challenge.id}`}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 ${
              isJoined
                ? 'border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 focus-visible:ring-rose-500'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md shadow-indigo-200 focus-visible:ring-indigo-600'
            }`}
          >
            {isJoined ? (
              <>
                <LogOut className="h-3.5 w-3.5" />
                Leave
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Join Challenge
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
