/**
 * Workout Session View Component
 * 
 * Live workout execution interface connected to SessionCommandService via useWorkoutSession().
 * Embeds SetLogger, RestTimer, previous performance display, and exercise substitution.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WorkoutSession, SessionExercise, Exercise, PreviousPerformanceSummary } from '@/types/domain';
import { useWorkoutSession } from '@/features/workout-session/use-workout-session';
import { ProgramService } from '@/lib/domain/program-service';
import { SetLogger } from './set-logger';
import { RestTimer } from './rest-timer';
import { ExercisePickerModal } from './exercise-picker-modal';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { useRecommendations } from '@/hooks/use-recommendations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  CheckCircle2,
  FastForward,
  RotateCcw,
  Pencil,
  Clock,
  Dumbbell,
  AlertCircle,
  Trophy,
  History,
  XCircle,
} from 'lucide-react';

export interface WorkoutSessionViewProps {
  initialSessionId?: string;
  onSessionCompleted: (session: WorkoutSession) => void;
  onAbandon: () => void;
}

export function WorkoutSessionView({
  initialSessionId,
  onSessionCompleted,
  onAbandon,
}: WorkoutSessionViewProps) {
  const {
    session,
    isLoading,
    error,
    logSet,
    updateSet,
    deleteSet,
    completeExercise,
    skipExercise,
    substituteExercise,
    completeSession,
    abandonSession,
    getPreviousPerformance,
  } = useWorkoutSession(initialSessionId);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [previousPerf, setPreviousPerf] = useState<PreviousPerformanceSummary | null>(null);
  const [isSubstitutePickerOpen, setIsSubstitutePickerOpen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Active exercise pointer
  const activeExercise: SessionExercise | undefined = session?.exercises[activeExerciseIndex];

  // Track session timer
  useEffect(() => {
    if (!session?.startedAt || session.status !== 'active') return;

    const startMs = new Date(session.startedAt).getTime();
    const interval = setInterval(() => {
      const nowMs = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.startedAt, session?.status]);

  const {
    recommendations,
    dismissRecommendation,
    acceptRecommendation,
  } = useRecommendations({ limit: 10 });

  const activeExerciseRec = recommendations.find(
    (r) =>
      r.targetEntityId === activeExercise?.exerciseId &&
      r.category === 'swap_exercise'
  );

  // Load previous performance whenever active exercise changes
  useEffect(() => {
    let isMounted = true;
    if (activeExercise?.exerciseId) {
      getPreviousPerformance(activeExercise.exerciseId).then((perf) => {
        if (isMounted) setPreviousPerf(perf);
      });
    } else {
      setPreviousPerf(null);
    }
    return () => {
      isMounted = false;
    };
  }, [activeExercise?.exerciseId, getPreviousPerformance]);

  const handleCompleteActiveExercise = async () => {
    if (!activeExercise) return;
    await completeExercise(activeExercise.id);
    if (activeExerciseIndex < (session?.exercises.length || 1) - 1) {
      setActiveExerciseIndex((prev) => prev + 1);
    }
  };

  const handleSkipActiveExercise = async () => {
    if (!activeExercise) return;
    await skipExercise(activeExercise.id);
    if (activeExerciseIndex < (session?.exercises.length || 1) - 1) {
      setActiveExerciseIndex((prev) => prev + 1);
    }
  };

  const handleSubstituteExercise = async (newEx: Exercise) => {
    if (!activeExercise) return;
    await substituteExercise({
      sessionExerciseId: activeExercise.id,
      replacementExerciseId: newEx.id,
      replacementName: newEx.name,
      substitutionReason: 'User live workout substitution',
    });
  };

  const searchParams = useSearchParams();
  const programId = searchParams.get('programId');
  const programDayId = searchParams.get('programDayId');

  const handleFinishWorkout = async () => {
    const completed = await completeSession();
    if (programId && programDayId) {
      try {
        const programService = new ProgramService();
        await programService.linkCompletedSession(programId, programDayId, completed.id);
      } catch (err) {
        console.error('[WorkoutSessionView] Failed to link completed session to program day:', err);
      }
    }
    onSessionCompleted(completed);
  };

  const handleAbandon = async () => {
    if (window.confirm('Are you sure you want to abandon this workout session?')) {
      await abandonSession();
      onAbandon();
    }
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const recentSet = previousPerf?.recentSets?.[0];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading active workout session...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl border border-rose-200 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-900">Session Error</h3>
        <p className="text-xs text-slate-500">{error?.message || 'No active session found.'}</p>
        <Button type="button" size="sm" onClick={onAbandon} className="text-xs">
          Return to Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Session Top Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Active Workout
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate max-w-md">
            {session.name}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Elapsed Timer */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Elapsed</span>
            <span className="text-sm font-mono font-black text-indigo-200">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleFinishWorkout}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md px-4 h-9"
          >
            <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            Finish Workout
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAbandon}
            className="h-9 px-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs"
            aria-label="Abandon session"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Rest Timer Widget */}
      <RestTimer
        initialSeconds={activeExercise?.plannedRestSeconds || 90}
      />

      {/* Main Grid: Exercise Selector + Active Exercise Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Exercise Queue (lg: 4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Exercise Queue ({session.exercises.length})
          </div>

          <div className="space-y-2">
            {session.exercises.map((ex, idx) => {
              const isCurrent = idx === activeExerciseIndex;
              const isCompleted = ex.status === 'completed';
              const isSkipped = ex.status === 'skipped';

              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setActiveExerciseIndex(idx)}
                  className={`w-full p-3.5 rounded-2xl text-left border flex items-center justify-between gap-2 transition-all ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/40 text-slate-600'
                      : isSkipped
                      ? 'border-slate-200 bg-slate-100/60 opacity-60'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-6 w-6 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{ex.name}</h4>
                      <span className="text-[10px] text-slate-500 block">
                        {ex.sets?.length || 0} / {ex.plannedSets || 3} sets logged
                      </span>
                    </div>
                  </div>

                  {isSkipped && (
                    <Badge variant="outline" className="text-[9px] py-0 text-slate-400">
                      Skipped
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Exercise & Logger (lg: 8 cols) */}
        {activeExercise ? (
          <div className="lg:col-span-8 space-y-4">
            {/* Active Exercise Detail Card */}
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Exercise #{activeExerciseIndex + 1}
                    </span>
                    {activeExercise.status === 'completed' && (
                      <Badge className="bg-emerald-600 text-white text-[10px] py-0">Completed</Badge>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {activeExercise.name}
                  </h3>
                </div>

                {/* Substitution / Replace */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubstitutePickerOpen(true)}
                  className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600 self-start sm:self-auto"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Substitute
                </Button>
              </div>

              {/* Prescription Bar */}
              <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Sets</span>
                  <span className="font-bold text-slate-800">{activeExercise.plannedSets || 3} Sets</span>
                </div>
                <span className="text-slate-300">•</span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Reps</span>
                  <span className="font-bold text-slate-800">{String(activeExercise.plannedReps || '8-12')}</span>
                </div>
                <span className="text-slate-300">•</span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rest</span>
                  <span className="font-bold text-slate-800">
                    {activeExercise.plannedRestSeconds ? `${activeExercise.plannedRestSeconds}s` : '90s'}
                  </span>
                </div>
              </div>

              {/* Previous Performance Banner */}
              {recentSet && recentSet.weight !== undefined && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center gap-2 text-xs text-indigo-900">
                  <History className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Previous best:{' '}
                    <strong>
                      {recentSet.weight} kg × {recentSet.reps} reps
                    </strong>{' '}
                    {recentSet.rpe && `(@ RPE ${recentSet.rpe})`}
                  </span>
                </div>
              )}

              {/* Contextual Exercise Progression / Substitution Recommendation */}
              {activeExerciseRec && (
                <RecommendationCard
                  recommendation={activeExerciseRec}
                  onApply={async (rec) => {
                    await acceptRecommendation(rec);
                    if (rec.category === 'swap_exercise') {
                      setIsSubstitutePickerOpen(true);
                    }
                  }}
                  onDismiss={dismissRecommendation}
                  compact
                />
              )}

              {/* Set Logger Component */}
              <SetLogger
                sessionExerciseId={activeExercise.id}
                loggedSets={activeExercise.sets || []}
                targetSetsCount={activeExercise.plannedSets || 3}
                targetRepsRange={String(activeExercise.plannedReps || '8-12')}
                onLogSet={logSet}
                onUpdateSet={updateSet}
                onDeleteSet={deleteSet}
              />

              {/* Exercise Navigation Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSkipActiveExercise}
                  className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
                >
                  <FastForward className="w-3.5 h-3.5 mr-1" />
                  Skip Movement
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCompleteActiveExercise}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs px-4"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  {activeExerciseIndex === session.exercises.length - 1
                    ? 'Complete Last Exercise'
                    : 'Complete & Next'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Substitute Exercise Picker */}
      <ExercisePickerModal
        isOpen={isSubstitutePickerOpen}
        onClose={() => setIsSubstitutePickerOpen(false)}
        onSelectExercise={handleSubstituteExercise}
        replacingExerciseName={activeExercise?.name}
      />
    </div>
  );
}
