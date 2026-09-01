'use client';

import React, { useState } from 'react';
import { AggregatedProgressMetrics } from '@/lib/domain/progress-analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, Dumbbell, ShieldCheck } from 'lucide-react';

interface StrengthTabProps {
  metrics: AggregatedProgressMetrics;
}

export const StrengthTab: React.FC<StrengthTabProps> = ({ metrics }) => {
  const [unitMode, setUnitMode] = useState<'kg' | 'lbs'>('kg');

  const maxDailyVolume = Math.max(1, ...metrics.volumeOverTime.map((v) => v.volumeKg));

  return (
    <div className="space-y-6">
      {/* 1. Volume Over Time Chart Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Volume Progression Over Time
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Total load multiplied by repetitions performed per training day
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <Button
                variant={unitMode === 'kg' ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-2.5 text-xs font-semibold ${
                  unitMode === 'kg'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setUnitMode('kg')}
              >
                KG
              </Button>
              <Button
                variant={unitMode === 'lbs' ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-2.5 text-xs font-semibold ${
                  unitMode === 'lbs'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setUnitMode('lbs')}
              >
                LBS
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.volumeOverTime.length > 0 ? (
            <div className="pt-4 pb-2">
              <div className="flex items-end justify-between gap-2 h-44 border-b border-slate-200 dark:border-slate-800 pb-2">
                {metrics.volumeOverTime.map((point) => {
                  const vol = unitMode === 'kg' ? point.volumeKg : point.volumeLbs;
                  const heightPercent = Math.max(10, Math.round((point.volumeKg / maxDailyVolume) * 100));

                  return (
                    <div
                      key={point.dateStr}
                      className="flex-1 flex flex-col items-center gap-1 group relative min-w-[28px]"
                    >
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow pointer-events-none whitespace-nowrap z-10">
                        {point.displayDate}: {vol.toLocaleString()} {unitMode} ({point.setsCount} sets)
                      </div>

                      <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {vol > 999 ? `${Math.round(vol / 1000)}k` : vol}
                      </div>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[32px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t transition-all duration-300 group-hover:from-emerald-700 group-hover:to-teal-500"
                        role="img"
                        aria-label={`${point.displayDate}: ${vol} ${unitMode}`}
                      />

                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-full">
                        {point.displayDate}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Accessible table summary */}
              <div className="sr-only">
                <table>
                  <caption>Volume progression data</caption>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Volume ({unitMode})</th>
                      <th>Sets</th>
                      <th>Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.volumeOverTime.map((p) => (
                      <tr key={p.dateStr}>
                        <td>{p.displayDate}</td>
                        <td>{unitMode === 'kg' ? p.volumeKg : p.volumeLbs}</td>
                        <td>{p.setsCount}</td>
                        <td>{p.repsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No load volume recorded in this period.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Grid Row: Day of Week Distribution & Bodyweight Training Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Day-of-Week Training Distribution */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              Day-of-Week Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Training session frequency across days of the week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.dayOfWeekDistribution.map((item) => (
              <div key={item.day} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{item.day}</span>
                  <span>{item.count} sessions ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={item.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bodyweight & Policy Details */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-indigo-500" />
              Bodyweight & Volume Semantics
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Precise separation of load-based vs bodyweight movements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Bodyweight-Only Sets
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {metrics.bodyweightOnlySets} sets
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Bodyweight Repetitions
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {metrics.bodyweightOnlyReps} reps
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-1">
              <div className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Volume Rule:</strong> Volume = Load (kg) × Reps. Sets without load are tracked by reps and sets to prevent misleading 0 kg distortion.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Integrity Rule:</strong> Deleted sets and abandoned sessions are excluded from volume analytics.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
