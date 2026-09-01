'use client';

import React from 'react';
import { AggregatedProgressMetrics } from '@/lib/domain/progress-analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Layers, Info } from 'lucide-react';

interface MusclesTabProps {
  metrics: AggregatedProgressMetrics;
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'bg-rose-500',
  back: 'bg-indigo-500',
  lats: 'bg-indigo-600',
  shoulders: 'bg-amber-500',
  deltoids: 'bg-amber-500',
  biceps: 'bg-emerald-500',
  triceps: 'bg-teal-500',
  quadriceps: 'bg-sky-500',
  hamstrings: 'bg-purple-500',
  glutes: 'bg-pink-500',
  calves: 'bg-cyan-500',
  core: 'bg-orange-500',
  abs: 'bg-orange-500',
};

export const MusclesTab: React.FC<MusclesTabProps> = ({ metrics }) => {
  const { muscleDistribution } = metrics;

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Target Muscle Distribution
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Derived dynamically through canonical ExerciseCatalog linkages (Primary: 1.0x, Secondary: 0.5x)
              </CardDescription>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {muscleDistribution.length} Muscle Groups Targeted
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {muscleDistribution.length > 0 ? (
            <div className="space-y-5">
              {/* Stacked Progress Bar */}
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
                {muscleDistribution.map((item) => {
                  const colorClass = MUSCLE_COLORS[item.muscleId.toLowerCase()] || 'bg-indigo-400';
                  return (
                    <div
                      key={item.muscleId}
                      style={{ width: `${item.percentage}%` }}
                      className={`${colorClass} h-full transition-all duration-300 hover:opacity-80`}
                      title={`${item.muscleName}: ${item.percentage}% (${item.weightedSets} weighted sets)`}
                      role="progressbar"
                      aria-valuenow={item.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  );
                })}
              </div>

              {/* Muscle Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {muscleDistribution.map((item) => {
                  const colorClass = MUSCLE_COLORS[item.muscleId.toLowerCase()] || 'bg-indigo-500';

                  return (
                    <div
                      key={item.muscleId}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/80 transition-colors shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${colorClass}`} />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                            {item.muscleName}
                          </h4>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          {item.percentage}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{item.weightedSets} weighted sets</span>
                        <span>
                          {item.isPrimaryCount}P / {item.isSecondaryCount}S
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanatory footnote */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-700 dark:text-indigo-300">
                <Info className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>
                  <strong>Weighting Methodology:</strong> Primary targets receive full weight (1.0) while secondary/assisting muscle groups receive half weight (0.5) per completed set.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No completed exercises in this period to evaluate muscle distribution.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
