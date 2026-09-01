'use client';

import React, { useState } from 'react';
import { CatalogProgramDefinition } from '@/lib/domain/platform-catalogs';
import { Calendar, Target, Award, Dumbbell, Check, Sparkles } from 'lucide-react';

interface ProgramCatalogCardProps {
  program: CatalogProgramDefinition;
  onAdopt: (catalogId: string, startDate?: string) => Promise<unknown>;
  isCurrentActive?: boolean;
}

export function ProgramCatalogCard({
  program,
  onAdopt,
  isCurrentActive = false,
}: ProgramCatalogCardProps) {
  const [adopting, setAdopting] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAdopt = async () => {
    setAdopting(true);
    try {
      await onAdopt(program.id, startDate);
      setShowDatePicker(false);
    } finally {
      setAdopting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
      <div>
        {/* Header Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
            {program.weeksCount} Weeks
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
            {program.daysPerWeek} Days/Wk
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground capitalize">
            {program.difficulty}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground">{program.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
          {program.description}
        </p>

        {/* Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize">{program.goal || 'General Fitness'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Dumbbell className="h-3.5 w-3.5 text-primary" />
            <span>Compound Focus</span>
          </div>
        </div>
      </div>

      {/* Footer / Adoption Action */}
      <div className="mt-5 border-t border-border/60 pt-4">
        {isCurrentActive ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            Currently Active
          </div>
        ) : showDatePicker ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span>Choose Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdopt}
                disabled={adopting}
                className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {adopting ? 'Adopting...' : 'Confirm & Start'}
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDatePicker(true)}
            id={`btn-adopt-${program.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Adopt Program
          </button>
        )}
      </div>
    </div>
  );
}
