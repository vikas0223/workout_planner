'use client';

import React from 'react';
import { AggregatedProgressMetrics } from '@/lib/domain/progress-analytics';
import { MetricCard } from './metric-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dumbbell,
  Flame,
  Clock,
  Trophy,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useRecommendations } from '@/hooks/use-recommendations';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { useRouter } from 'next/navigation';
import { DeterministicRecommendation } from '@/lib/domain/recommendations';

interface OverviewTabProps {
  metrics: AggregatedProgressMetrics;
  onNavigateToHistory: () => void;
  onNavigateToPRs: () => void;
  onStartWorkout: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  onNavigateToHistory,
  onNavigateToPRs,
  onStartWorkout,
}) => {
  const router = useRouter();
  const latestWorkout = metrics.recentWorkouts[0];
  const {
    primaryRecommendation,
    dismissRecommendation,
    acceptRecommendation,
  } = useRecommendations({ limit: 1 });

  const handleApplyRecommendation = async (rec: DeterministicRecommendation) => {
    await acceptRecommendation(rec);
    if (rec.actionPayload.navigationTarget) {
      router.push(rec.actionPayload.navigationTarget);
    } else if (rec.actionPayload.type === 'start_program_day' && rec.actionPayload.programId) {
      router.push(`/programs/${rec.actionPayload.programId}`);
    } else if (rec.actionPayload.type === 'view_goal') {
      router.push('/goals');
    } else {
      onStartWorkout();
    }
  };

  return (
    <div className="space-y-6">
      {/* Contextual Recommendation Card */}
      {primaryRecommendation && (
        <RecommendationCard
          recommendation={primaryRecommendation}
          onApply={handleApplyRecommendation}
          onDismiss={dismissRecommendation}
        />
      )}

      {/* 1. Top KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Workouts Completed"
          value={metrics.completedWorkoutsCount}
          subtext={
            metrics.startedWorkoutsCount > metrics.completedWorkoutsCount
              ? `${metrics.startedWorkoutsCount} total started`
              : 'Consistent training'
          }
          icon={Dumbbell}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-950/50"
        />

        <MetricCard
          label="Volume Moved"
          value={metrics.totalVolumeKg.toLocaleString()}
          unit="kg"
          subtext={
            metrics.bodyweightOnlySets > 0
              ? `+ ${metrics.bodyweightOnlySets} bodyweight sets`
              : `${metrics.totalPerformedSets} total performed sets`
          }
          icon={TrendingUp}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
        />

        <MetricCard
          label="Total Duration"
          value={metrics.totalDurationMinutes}
          unit="min"
          subtext={
            metrics.averageDurationMinutes > 0
              ? `Avg ${metrics.averageDurationMinutes} min / session`
              : 'Logged training time'
          }
          icon={Clock}
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-50 dark:bg-sky-950/50"
        />

        <MetricCard
          label="Current Streak"
          value={metrics.currentStreakDays}
          unit="days"
          subtext={
            metrics.longestStreakDays > 0
              ? `Best: ${metrics.longestStreakDays} days`
              : 'Keep up the momentum'
          }
          icon={Flame}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/50"
        />
      </div>

      {/* 2. Middle Row: Weekly Goal Progress & Latest Session Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Goal Progress */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-500" />
                Weekly Target
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                This Week
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {metrics.weeklyCompletedCount} of {metrics.weeklyTarget} workouts completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Progress</span>
                <span>{metrics.weeklyTargetProgressPercentage}%</span>
              </div>
              <Progress
                value={metrics.weeklyTargetProgressPercentage}
                className="h-2.5 bg-slate-100 dark:bg-slate-800"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>
                {metrics.weeklyCompletedCount >= metrics.weeklyTarget
                  ? '🎉 Weekly goal achieved!'
                  : `${metrics.weeklyTarget - metrics.weeklyCompletedCount} more to reach your goal`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Latest Workout Summary Card */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Latest Workout
              </CardTitle>
              {latestWorkout && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {latestWorkout.dateStr}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {latestWorkout ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {latestWorkout.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {latestWorkout.exercisesCount} exercises · {latestWorkout.performedSetsCount} sets performed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      {latestWorkout.durationMinutes} min
                    </span>
                    {latestWorkout.totalVolumeKg > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {latestWorkout.totalVolumeKg.toLocaleString()} kg volume
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {latestWorkout.status === 'completed' ? 'Completed' : 'Logged'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateToHistory}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 p-0 h-auto font-semibold flex items-center gap-1"
                  >
                    View History <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No workouts recorded in this period yet.
                </p>
                <Button size="sm" onClick={onStartWorkout} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  Start Training
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Bottom Row: Weekly Frequency Over Time Visualization */}
      {metrics.weeklyFrequency.length > 0 && (
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Training Frequency Over Time
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Workouts completed per calendar week
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Visual Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="flex items-end justify-between gap-2 h-36 border-b border-slate-200 dark:border-slate-800 pb-2">
                {metrics.weeklyFrequency.map((item) => {
                  const maxCount = Math.max(1, ...metrics.weeklyFrequency.map((f) => f.count));
                  const heightPercent = Math.max(12, Math.round((item.count / maxCount) * 100));

                  return (
                    <div
                      key={item.weekKey}
                      className="flex-1 flex flex-col items-center gap-1 group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow pointer-events-none whitespace-nowrap z-10">
                        {item.count} workouts · {item.volumeKg.toLocaleString()} kg
                      </div>

                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {item.count}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all duration-300 group-hover:from-indigo-700 group-hover:to-indigo-500"
                        role="img"
                        aria-label={`${item.weekLabel}: ${item.count} workouts, ${item.volumeKg} kg volume`}
                      />
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-full">
                        {item.weekLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Screen-reader accessible summary table */}
            <div className="sr-only">
              <table>
                <caption>Weekly Training Frequency Summary</caption>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Workouts</th>
                    <th>Volume (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.weeklyFrequency.map((f) => (
                    <tr key={f.weekKey}>
                      <td>{f.weekLabel}</td>
                      <td>{f.count}</td>
                      <td>{f.volumeKg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
