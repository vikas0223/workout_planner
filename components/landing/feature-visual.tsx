/**
 * Feature Story High-Fidelity UI Visuals (Part 16 & 17)
 *
 * Faithfully represents Replyf's core training loop across four chapters:
 * 1. PLAN: Workout Generator & Plan Structure
 * 2. TRAIN: Active Set Logger with Animated Rep Progression
 * 3. TRACK: Progress Analytics & Volume Trends
 * 4. IMPROVE: Deterministic Adaptive Recommendations
 */

'use client';

import React from 'react';
import { LandingFeatureId } from '@/lib/landing/landing-features';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Minus,
  ArrowDownRight,
  Layers,
  Dumbbell,
  Timer,
  Trophy,
} from 'lucide-react';

export interface FeatureVisualProps {
  activeId: LandingFeatureId;
}

export function FeatureVisual({ activeId }: FeatureVisualProps) {
  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[500px] flex items-center justify-center p-2 sm:p-4">
      {/* 1. PLAN VISUAL */}
      <div
        className={`w-full max-w-[480px] rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xl transition-all duration-300 ${
          activeId === 'plan' ? 'opacity-100 scale-100 z-10' : 'hidden opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Generator</p>
              <h3 className="text-sm font-black text-slate-900">Upper Body Hypertrophy</h3>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Generated
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Goal</span>
            <span className="text-xs font-bold text-slate-800">Muscle Growth</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Frequency</span>
            <span className="text-xs font-bold text-slate-800">4 Days / Wk</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Duration</span>
            <span className="text-xs font-bold text-slate-800">50 mins</span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Incline Dumbbell Press</p>
              <p className="text-[11px] text-slate-500">Chest & Shoulders</p>
            </div>
            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">3 × 10</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Barbell Bent-Over Row</p>
              <p className="text-[11px] text-slate-500">Upper Back & Lats</p>
            </div>
            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">3 × 8</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Overhead Dumbbell Extension</p>
              <p className="text-[11px] text-slate-500">Triceps</p>
            </div>
            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">3 × 12</span>
          </div>
        </div>
      </div>

      {/* 2. TRAIN VISUAL */}
      <div
        className={`w-full max-w-[480px] rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xl transition-all duration-300 ${
          activeId === 'train' ? 'opacity-100 scale-100 z-10' : 'hidden opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live Workout</p>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-0.5">Barbell Bench Press</h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold font-mono">
            <Timer className="w-3.5 h-3.5" />
            <span>01:14 rest</span>
          </div>
        </div>

        {/* Set Progression Table */}
        <div className="py-4 space-y-2">
          {/* Set 1 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-emerald-900 font-mono">SET 1</span>
              <span className="font-semibold text-slate-800">80 kg × 8 reps</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
              <span>RPE 7.5</span>
            </span>
          </div>

          {/* Set 2 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-emerald-900 font-mono">SET 2</span>
              <span className="font-semibold text-slate-800">80 kg × 8 reps</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
              <span>RPE 8.0</span>
            </span>
          </div>

          {/* Set 3 (Active) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 ring-2 ring-indigo-500/20 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-indigo-900 font-mono">SET 3</span>
              <span className="font-bold text-indigo-950">80 kg × 8 reps</span>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              Current Set →
            </span>
          </div>

          {/* Set 4 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs opacity-60">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-500 font-mono">SET 4</span>
              <span className="text-slate-600">80 kg × 8 reps</span>
            </div>
            <span className="text-[11px] text-slate-400">Target</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center font-medium">
          Instant set completion • Rest timer auto-triggers
        </p>
      </div>

      {/* 3. TRACK VISUAL */}
      <div
        className={`w-full max-w-[480px] rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xl transition-all duration-300 ${
          activeId === 'track' ? 'opacity-100 scale-100 z-10' : 'hidden opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Training Intelligence</p>
            <h3 className="text-base font-black text-slate-900">Monthly Snapshot</h3>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <TrendingUp className="w-3.5 h-3.5" />
            +18% volume
          </span>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Volume</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">14,250 kg</p>
            <p className="text-[10px] text-emerald-600 font-semibold">+2,100 kg vs last mo</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Consistency</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">86%</p>
            <p className="text-[10px] text-indigo-600 font-semibold">12 sessions completed</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated 1RM</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">102.5 kg</p>
            <p className="text-[10px] text-slate-500 font-semibold">Bench Press (all-time)</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <span className="text-[10px] text-indigo-500 font-bold uppercase">Personal Records</span>
            <p className="text-lg font-black text-indigo-950 mt-0.5">4 PRs</p>
            <p className="text-[10px] text-indigo-700 font-semibold">Logged this month</p>
          </div>
        </div>

        {/* Volume Distribution Bars */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span>Weekly Target Sets</span>
            <span>18 / 20 sets</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full w-[90%]" />
          </div>
        </div>
      </div>

      {/* 4. IMPROVE VISUAL */}
      <div
        className={`w-full max-w-[480px] rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xl transition-all duration-300 ${
          activeId === 'improve' ? 'opacity-100 scale-100 z-10' : 'hidden opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Session</p>
            <h3 className="text-base font-black text-slate-900">Deterministic Adaptations</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
            Calculated
          </span>
        </div>

        <div className="py-4 space-y-3 text-xs">
          {/* Recommendation 1: Progression */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-emerald-950">Bench Press</p>
                <span className="font-bold text-emerald-700">+2.5 kg</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-relaxed">
                Clean target reps achieved across 2 consecutive sessions. Progressive overload proposed.
              </p>
            </div>
          </div>

          {/* Recommendation 2: Maintenance */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-slate-400 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Minus className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">Lat Pulldown</p>
                <span className="font-semibold text-slate-600">Keep 65 kg</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                RPE within 8.5 target. Solid technique consolidation recommended before advancing load.
              </p>
            </div>
          </div>

          {/* Recommendation 3: Fatigue / Volume Adjustment */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ArrowDownRight className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-amber-950">Split Squat</p>
                <span className="font-bold text-amber-800">Adjust volume (-1 set)</span>
              </div>
              <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                Unilateral fatigue detected. Modulating volume to protect form and allow joint recovery.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 text-center font-semibold">
          No vague guesswork • Objective training logic
        </p>
      </div>
    </div>
  );
}
