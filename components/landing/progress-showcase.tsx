/**
 * Progress Showcase Section (Part 17 & 25)
 *
 * Demonstrates how Replyf transforms raw set logs into actionable analytics:
 * - Heading: "Your training history becomes useful."
 * - Description: "See the work you've done, the progress you've made, and where your next improvement can come from."
 * - Persuasive metrics labeled as "Example training snapshot"
 */

import React from 'react';
import { TrendingUp, Award, Calendar, BarChart2, Flame } from 'lucide-react';

const SNAPSHOT_METRICS = [
  { label: 'Workouts Completed', value: '12', subtext: 'Consistent 3x/wk frequency', icon: Calendar },
  { label: 'Volume Progression', value: '+18%', subtext: 'Progressive overload on track', icon: TrendingUp },
  { label: 'Personal Records', value: '4 PRs', subtext: 'Squat, Bench, Row, Deadlift', icon: Award },
  { label: 'Consistency Score', value: '86%', subtext: 'Above target adherence', icon: Flame },
];

export function ProgressShowcase() {
  return (
    <section
      id="progress"
      className="relative w-full px-4 sm:px-6 py-16 md:py-24 scroll-mt-24 bg-gradient-to-b from-white via-indigo-50/20 to-white"
      aria-label="Progress Analytics"
    >
      <div className="mx-auto max-w-[1320px]">
        {/* Section Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">
            Progress Analytics
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Your training history becomes useful.
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            See the work you&apos;ve done, the progress you&apos;ve made, and where your next improvement can come from.
          </p>
          <div className="mt-3 inline-block px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
            Example training snapshot
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {SNAPSHOT_METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{m.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{m.subtext}</p>
              </div>
            );
          })}
        </div>

        {/* High-Fidelity Dashboard Graphic Frame */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xl max-w-[1080px] mx-auto overflow-hidden">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Training Volume Over Time</h3>
              <p className="text-xs text-slate-500 mt-0.5">Calculated set load across completed mesocycles</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">Total Volume</span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Intensity</span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Est. 1RM</span>
            </div>
          </div>

          {/* Chart Visual Simulation */}
          <div className="py-6">
            <div className="h-44 sm:h-52 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
              {[
                { week: 'W1', vol: 40, label: '9,800 kg' },
                { week: 'W2', vol: 55, label: '11,200 kg' },
                { week: 'W3', vol: 62, label: '12,500 kg' },
                { week: 'W4', vol: 50, label: '10,900 kg (Deload)' },
                { week: 'W5', vol: 72, label: '13,400 kg' },
                { week: 'W6', vol: 85, label: '14,250 kg' },
              ].map((bar) => (
                <div key={bar.week} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {bar.label}
                  </span>
                  <div
                    style={{ height: `${bar.vol}%` }}
                    className="w-full max-w-[56px] rounded-xl bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-700 group-hover:to-indigo-500 transition-all shadow-xs"
                  />
                  <span className="text-xs font-bold text-slate-500">{bar.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Muscle Focus Breakdown */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block">Chest / Push</span>
              <span className="font-bold text-slate-900 text-sm">34% of volume</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Back / Pull</span>
              <span className="font-bold text-slate-900 text-sm">28% of volume</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Legs / Posterior</span>
              <span className="font-bold text-slate-900 text-sm">26% of volume</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Arms & Core</span>
              <span className="font-bold text-slate-900 text-sm">12% of volume</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
