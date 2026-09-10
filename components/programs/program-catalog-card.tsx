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
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
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
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md">
      <div>
        {/* Header Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-indigo-700 border border-indigo-100/80 font-bold">
            {program.weeksCount} Weeks
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700 font-semibold">
            {program.daysPerWeek} Days/Wk
          </span>
          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-purple-700 border border-purple-100/80 capitalize font-semibold">
            {program.difficulty}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900">{program.name}</h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-3">
          {program.description}
        </p>

        {/* Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Target className="h-3.5 w-3.5 text-indigo-600" />
            <span className="capitalize">{program.goal || 'General Fitness'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Dumbbell className="h-3.5 w-3.5 text-indigo-600" />
            <span>Compound Focus</span>
          </div>
        </div>
      </div>

      {/* Footer / Adoption Action */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        {isCurrentActive ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 py-2.5 text-xs font-bold text-emerald-700">
            <Check className="h-4 w-4 text-emerald-600" />
            Currently Active
          </div>
        ) : showDatePicker ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>Choose Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdopt}
                disabled={adopting}
                className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all"
              >
                {adopting ? 'Adopting...' : 'Confirm & Start'}
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDatePicker(true)}
            id={`btn-adopt-${program.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 py-2.5 text-xs font-bold transition shadow-xs hover:shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Adopt Program
          </button>
        )}
      </div>
    </div>
  );
}
