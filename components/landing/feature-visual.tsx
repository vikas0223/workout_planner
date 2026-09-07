/**
 * Feature Story High-Fidelity UI Visuals
 *
 * Embodies the central product loop with continuous narrative causality:
 * PLAN: User chooses goal → "Upper Body Hypertrophy" generated
 * TRAIN: That SAME workout is performed (Bench Press active session)
 * TRACK: That SAME workout becomes training history (Volume & PR analytics)
 * IMPROVE: That SAME history calculates deterministic adaptations (+2.5 kg Bench Press)
 * NEXT WORKOUT: Loop closure
 */

'use client';

import React from 'react';
import { LandingFeatureId } from '@/lib/landing/landing-features';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Minus,
  ArrowDownRight,
  Dumbbell,
  Timer,
  Trophy,
  ArrowRight,
  Play,
  Flame,
  Plus,
} from 'lucide-react';

export interface FeatureVisualProps {
  activeId: LandingFeatureId;
}

export function FeatureVisual({ activeId }: FeatureVisualProps) {
  return (
    <div className="relative w-full h-full min-h-[490px] sm:min-h-[530px] flex items-center justify-center p-2 sm:p-4">
      {/* =========================================================================
          1. PLAN VISUAL — Workout Generated
      ========================================================================= */}
      <div
        className={`w-full max-w-[480px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl transition-all duration-300 ${
          activeId === 'plan' ? 'opacity-100 scale-100 z-10' : 'hidden opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workout Generator</p>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Upper Body Hypertrophy</h3>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
            Generated
          </span>
        </div>

        {/* Input Parameters Summary */}
        <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Goal</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Muscle Growth</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Frequency</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">4 Days / Wk</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Duration</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">50 mins</span>
          </div>
        </div>

        {/* Generated Exercise Schedule */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between ring-1 ring-indigo-500/20">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-indigo-950 dark:text-indigo-200">Bench Press</p>
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.2 rounded">Primary</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">Chest • Barbell</p>
            </div>
            <span className="font-mono font-bold text-indigo-800 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700">
              3 × 8 @ 80 kg
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Incline Dumbbell Press</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Upper Chest • Dumbbells</p>
            </div>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
              3 × 10
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Barbell Bent-Over Row</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Upper Back • Barbell</p>
            </div>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
              3 × 8
            </span>
          </div>
        </div>

        {/* Narrative causality footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Ready for execution</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <span>Next: Train this workout</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. TRAIN VISUAL — Active Workout (SAME WORKOUT IN ACTION)
      ========================================================================= */}
      <div
        className={`w-full max-w-[480px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl transition-all duration-300 ${
          activeId === 'train' ? 'opacity-100 scale-100 z-10' : 'hidden opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Live Workout • Upper Body Hypertrophy
              </p>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              Bench Press
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
            <Timer className="w-3.5 h-3.5" />
            <span>01:45 rest</span>
          </div>
        </div>

        {/* Set Progression Table */}
        <div className="py-3.5 space-y-2">
          {/* Set 1: Done */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 font-mono">SET 1</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">80 kg × 8 reps</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
              <span>RPE 7.5</span>
            </span>
          </div>

          {/* Set 2: Done */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 font-mono">SET 2</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">80 kg × 8 reps</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
              <span>RPE 8.0</span>
            </span>
          </div>

          {/* Set 3: Active Current */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 font-mono">SET 3</span>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full">
                  Current
                </span>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">Target: 80 kg × 8</span>
            </div>

            {/* Set completion controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">LOAD</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">80 kg</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">REPS</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">8 reps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Set 3 logs automatically</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>Next: Work becomes data</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* =========================================================================
          3. TRACK VISUAL — Progress Analytics (SAME WORKOUT BECOMES DATA)
      ========================================================================= */}
      <div
        className={`w-full max-w-[480px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl transition-all duration-300 ${
          activeId === 'track' ? 'opacity-100 scale-100 z-10' : 'hidden opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Training History</p>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500">
                Example snapshot
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">Progress Dashboard</h3>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            <TrendingUp className="w-3.5 h-3.5" />
            +18% volume
          </span>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Volume</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">14,250 kg</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">+18% mesocycle trend</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Consistency</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">86%</p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">12 workouts logged</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800">
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase">Bench Press Est. 1RM</span>
            <p className="text-lg font-black text-indigo-950 dark:text-indigo-200 mt-0.5">102.5 kg</p>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">All-time record</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Personal Records</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">4 PRs</p>
            <p className="text-[10px] text-slate-500 font-semibold">Logged this month</p>
          </div>
        </div>

        {/* Volume Trend Bar Visual */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span>Weekly Volume Load (W1–W6)</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">14,250 kg max</span>
          </div>
          <div className="h-10 w-full flex items-end gap-2 px-1">
            {[45, 60, 68, 55, 82, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden h-full flex items-end">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-md"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Narrative causality footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">History evaluated</span>
          <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <span>Next: Drives next decision</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* =========================================================================
          4. IMPROVE VISUAL — Deterministic Adaptive Progression
      ========================================================================= */}
      <div
        className={`w-full max-w-[480px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl transition-all duration-300 ${
          activeId === 'improve' ? 'opacity-100 scale-100 z-10' : 'hidden opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Session Decisions</p>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Recommendations</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-full">
            Calculated
          </span>
        </div>

        <div className="py-3.5 space-y-2.5 text-xs">
          {/* 1. INCREASE (Bench Press progressive overload from earlier stage) */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-emerald-950 dark:text-emerald-200">Bench Press</p>
                <span className="font-black text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  +2.5 kg ↑
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300 mt-0.5 leading-relaxed">
                Clean 3×8 @ 80 kg completed with RPE 8.0. Progressive overload triggered for next session.
              </p>
            </div>
          </div>

          {/* 2. MAINTAIN */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-slate-400 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Minus className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900 dark:text-white">Lat Pulldown</p>
                <span className="font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Keep 65 kg →
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Target RPE in optimal range. Consolidate movement efficiency before loading further.
              </p>
            </div>
          </div>

          {/* 3. ADJUST */}
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ArrowDownRight className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-amber-950 dark:text-amber-200">Split Squat</p>
                <span className="font-bold text-amber-800 dark:text-amber-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  Adjust volume (-1 set)
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300 mt-0.5 leading-relaxed">
                Fatigue signal detected. Modulating volume to protect form and allow joint recovery.
              </p>
            </div>
          </div>
        </div>

        {/* Accept Button */}
        <div className="pt-2">
          <button
            type="button"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Accept & Build Next Workout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
