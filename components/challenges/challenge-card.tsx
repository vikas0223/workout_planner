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
      className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
        isCompleted
          ? 'border-emerald-500/40 bg-gradient-to-br from-card via-card to-emerald-500/5'
          : isJoined
          ? 'border-primary/40 bg-gradient-to-br from-card via-card to-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <div>
        {/* Top Meta Tags */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize">{challenge.type.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isCompleted ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            ) : isJoined ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Joined
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {daysRemaining}d left
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mt-3 text-base font-bold tracking-tight text-foreground">{challenge.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {challenge.description || `Reach ${challenge.targetValue} ${challenge.unit} to complete this challenge.`}
        </p>

        {/* Progress Display (if joined or completed) */}
        {isJoined && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-bold text-foreground">{statusLabel}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="text-[11px] text-muted-foreground">
          Goal: <strong>{challenge.targetValue} {challenge.unit}</strong>
        </div>

        {isCompleted ? (
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-4 w-4" />
            Reward Earned
          </div>
        ) : (
          <button
            onClick={handleToggleJoin}
            disabled={loading}
            id={`btn-challenge-${challenge.id}`}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 ${
              isJoined
                ? 'border border-border bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
