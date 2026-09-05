/**
 * Routine Builder Showcase Section (Part 18 & 26)
 *
 * Demonstrates flexibility:
 * - Heading: "Train your way."
 * - Description: "Generate a structured workout in seconds or build every detail yourself."
 * - Two modes: WORKOUT GENERATOR vs CUSTOM BUILDER
 */

import React from 'react';
import Link from 'next/link';
import { Sparkles, Sliders, ArrowRight, Check, Dumbbell, Calendar, Target } from 'lucide-react';

export function RoutineBuilderShowcase() {
  return (
    <section
      id="how-it-works"
      className="relative w-full px-4 sm:px-6 py-16 md:py-24 scroll-mt-24 border-b border-slate-200/60"
      aria-label="How it Works"
    >
      <div className="mx-auto max-w-[1320px]">
        {/* Section Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">
            Flexible Workout Creation
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Train your way.
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Generate a structured workout in seconds or build every detail yourself.
          </p>
        </div>

        {/* 2 Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1100px] mx-auto">
          {/* Card 1: Workout Generator */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Option A</span>
                  <h3 className="text-xl font-black text-slate-900">Workout Generator</h3>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Answer 6 guided questions about your target goal, weekly schedule, training experience, and available equipment. Replyf builds a balanced routine instantly.
              </p>

              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Fitness Goal
                  </span>
                  <span className="text-slate-900 font-bold">Strength / Hypertrophy</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Weekly Schedule
                  </span>
                  <span className="text-slate-900 font-bold">3–5 days / week</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-indigo-600" />
                    Available Equipment
                  </span>
                  <span className="text-slate-900 font-bold">Barbells, DBs, Cables</span>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="min-h-[44px] w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Generate a Workout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Custom Builder */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Option B</span>
                  <h3 className="text-xl font-black text-slate-900">Custom Builder</h3>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Have a specific program in mind? Handcraft exercises, configure rep ranges, set rest timer thresholds, and organize muscle target groups with precision.
              </p>

              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    Exercise Catalog
                  </span>
                  <span className="text-slate-900 font-bold">Search & filter by muscle</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    Custom Sets & Reps
                  </span>
                  <span className="text-slate-900 font-bold">Granular set-by-set targets</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    Template Library
                  </span>
                  <span className="text-slate-900 font-bold">Saved for offline execution</span>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="min-h-[44px] w-full rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Build Custom Routine</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Global CTA button */}
        <div className="text-center mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            <span>Build your first workout in Replyf →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
