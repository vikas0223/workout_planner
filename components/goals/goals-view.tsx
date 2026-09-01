'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGoals } from '@/hooks/use-goals';
import { GoalCard } from './goal-card';
import { CreateGoalModal } from './create-goal-modal';
import { Target, Plus, Trophy, CheckCircle2, TrendingUp, ArrowLeft } from 'lucide-react';

export function GoalsView() {
  const { evaluatedGoals, loading, saveGoal, deleteGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeGoals = evaluatedGoals.filter((g) => !g.isAchieved);
  const completedGoals = evaluatedGoals.filter((g) => g.isAchieved);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Evaluating fitness goals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title="Back to Home / Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Fitness Goals</h1>
            <p className="text-xs text-muted-foreground">
              Set quantifiable milestones for volume, frequency, strength, and session completion.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          id="btn-create-goal"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Set New Goal
        </button>
      </div>

      {/* Active Goals Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Active Targets ({activeGoals.length})</h2>
          </div>
        </div>

        {activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((eg) => (
              <GoalCard key={eg.goal.id} evaluatedGoal={eg} onDelete={deleteGoal} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">No Active Goals Set</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Define a weekly frequency target, total volume goal, or strength benchmark to track your ongoing progress.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Goal
            </button>
          </div>
        )}
      </section>

      {/* Completed Milestones */}
      {completedGoals.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-bold text-foreground">
              Achieved Milestones ({completedGoals.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((eg) => (
              <GoalCard key={eg.goal.id} evaluatedGoal={eg} onDelete={deleteGoal} />
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveGoal}
      />
    </div>
  );
}
