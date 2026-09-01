'use client';

import React from 'react';
import Link from 'next/link';
import { usePrograms } from '@/hooks/use-programs';
import { ActiveProgramCard } from './active-program-card';
import { ProgramCatalogCard } from './program-catalog-card';
import { Plus, BookOpen, Layers, CheckCircle2, Play, Pause, Trash2, Calendar } from 'lucide-react';

export function ProgramsView() {
  const {
    programs,
    activeProgram,
    adherence,
    todaysDay,
    catalogPrograms,
    loading,
    adoptProgram,
    rescheduleDay,
    skipDay,
    setActive,
    pauseProgram,
    deleteProgram,
  } = usePrograms();

  const inactivePrograms = programs.filter((p) => p.id !== activeProgram?.id);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Loading training programs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Training Programs</h1>
          <p className="text-xs text-muted-foreground">
            Structured periodization cycles, multi-week progressions, and daily adherence tracking.
          </p>
        </div>

        <Link
          href="/programs/builder"
          id="btn-create-program"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Custom Program
        </Link>
      </div>

      {/* Active Program Section */}
      {activeProgram ? (
        <section className="space-y-3">
          <ActiveProgramCard
            program={activeProgram}
            adherence={adherence}
            todaysDay={todaysDay}
            onRescheduleDay={rescheduleDay}
            onSkipDay={skipDay}
            onPause={() => pauseProgram(activeProgram.id)}
          />
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-foreground">No Active Program Selected</h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Adopt a battle-tested routine from the platform catalog below or design your own custom multi-week cycle to unlock automated scheduling.
          </p>
        </div>
      )}

      {/* Saved / Inactive Programs */}
      {inactivePrograms.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">My Other Saved Programs</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactivePrograms.map((prog) => (
              <div
                key={prog.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-border/80"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {prog.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {prog.weeks.length} Weeks
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-foreground line-clamp-1">
                    {prog.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {prog.description || 'Custom user training plan.'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <Link
                    href={`/programs/${prog.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    View Plan
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActive(prog.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Set Active
                    </button>
                    <button
                      onClick={() => deleteProgram(prog.id)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                      title="Delete Program"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Platform Program Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Platform Program Catalog</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {catalogPrograms.length} Curated Plans
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalogPrograms.map((catProg) => (
            <ProgramCatalogCard
              key={catProg.id}
              program={catProg}
              onAdopt={adoptProgram}
              isCurrentActive={activeProgram?.name === catProg.name}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
