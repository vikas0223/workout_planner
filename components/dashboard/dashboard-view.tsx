'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/use-dashboard';
import { ProgressPeriod } from '@/lib/domain/progress-period';
import { OverviewTab } from './overview-tab';
import { StrengthTab } from './strength-tab';
import { MusclesTab } from './muscles-tab';
import { PersonalRecordsTab } from './personal-records-tab';
import { HistoryTab } from './history-tab';
import { DashboardEmptyState } from './empty-state';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  Sparkles,
  Compass,
  WifiOff,
  RefreshCw,
  LayoutDashboard,
  TrendingUp,
  Layers,
  Trophy,
  History,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const router = useRouter();
  const {
    isLoading,
    isOffline,
    error,
    period,
    setPeriod,
    metrics,
    personalRecords,
    rawSessions,
    refresh,
  } = useDashboard('30d', 4);

  const [activeTab, setActiveTab] = useState<string>('overview');

  const periodOptions: { label: string; value: ProgressPeriod }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'All Time', value: 'all' },
  ];

  const hasAnySessions = rawSessions.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Header Bar with Back and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Home
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Training Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Canonical workout insights, volume tracking & progression records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/exercises')}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs h-9"
          >
            <Compass className="w-3.5 h-3.5 mr-1.5" />
            Exercises
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            New Workout
          </Button>
        </div>
      </div>

      {/* 2. Offline Status Banner */}
      {isOffline && (
        <Alert className="bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200">
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-xs font-bold">Offline Authority Active</AlertTitle>
          <AlertDescription className="text-xs">
            Viewing locally persisted training history. Analytics will continue to calculate seamlessly offline.
          </AlertDescription>
        </Alert>
      )}

      {/* 3. Error Banner */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Analytics Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-xs">
            <span>{error.message}</span>
            <Button size="sm" variant="outline" onClick={refresh} className="h-7 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 4. Main Body: Loading vs Empty vs Data */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Aggregating canonical training metrics...
          </p>
        </div>
      ) : !hasAnySessions || !metrics ? (
        <DashboardEmptyState
          onGenerateWorkout={() => router.push('/')}
          onBuildRoutine={() => router.push('/')}
          onExploreExercises={() => router.push('/exercises')}
        />
      ) : (
        <div className="space-y-6">
          {/* Period Filter Bar & Tab Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Tabs List */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl h-auto">
                <TabsTrigger
                  value="overview"
                  className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 py-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="strength"
                  className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 py-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
                  Volume
                </TabsTrigger>
                <TabsTrigger
                  value="muscles"
                  className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 py-1.5"
                >
                  <Layers className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
                  Muscles
                </TabsTrigger>
                <TabsTrigger
                  value="prs"
                  className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 py-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
                  PRs
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 py-1.5"
                >
                  <History className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
                  History
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-end md:self-auto shrink-0">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    period === opt.value
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'overview' && (
            <OverviewTab
              metrics={metrics}
              onNavigateToHistory={() => setActiveTab('history')}
              onNavigateToPRs={() => setActiveTab('prs')}
              onStartWorkout={() => router.push('/')}
            />
          )}

          {activeTab === 'strength' && <StrengthTab metrics={metrics} />}

          {activeTab === 'muscles' && <MusclesTab metrics={metrics} />}

          {activeTab === 'prs' && <PersonalRecordsTab personalRecords={personalRecords} />}

          {activeTab === 'history' && <HistoryTab sessions={rawSessions} />}
        </div>
      )}
    </div>
  );
};
