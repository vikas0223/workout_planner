/**
 * Feature Story Interactive Section
 *
 * Dedicated to Replyf's continuous training journey:
 * 1. Training Loop Introduction (From your goal to your next breakthrough)
 * 2. 01 PLAN → 02 TRAIN → 03 TRACK → 04 IMPROVE
 *    - Desktop (≥ 768px): Left scrollable narrative / Right pinned sticky visual
 *    - Mobile (< 768px): High-readability stacked touch-friendly sequence
 * 3. Story Loop Closure (Every workout feeds the next one - circular loop)
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LANDING_FEATURES, LandingFeatureId } from '@/lib/landing/landing-features';
import { FeatureCopy } from './feature-copy';
import { FeatureVisual } from './feature-visual';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Sparkles,
  ArrowRight,
  RotateCw,
  Repeat,
  CheckCircle2,
  Calendar,
  Layers,
  Dumbbell,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

export function FeatureStory() {
  const [activeFeatureId, setActiveFeatureId] = useState<LandingFeatureId>('plan');
  const sectionRef = useRef<HTMLElement>(null);
  const stickyVisualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only execute on client and when reduced motion is not active
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Desktop ScrollTriggers for feature articles
      const articles = document.querySelectorAll<HTMLElement>('.feature-article-card');
      articles.forEach((article) => {
        const featureId = article.getAttribute('data-feature') as LandingFeatureId;
        if (!featureId) return;

        ScrollTrigger.create({
          trigger: article,
          start: 'top 65%',
          end: 'bottom 35%',
          onEnter: () => setActiveFeatureId(featureId),
          onEnterBack: () => setActiveFeatureId(featureId),
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative w-full px-4 sm:px-6 py-16 md:py-24 scroll-mt-24 border-b border-slate-200/60 dark:border-slate-800"
      aria-label="Features Story"
    >
      {/* Anchor alias so #how-it-works smoothly links here */}
      <div id="how-it-works" className="scroll-mt-28" />

      <div className="mx-auto max-w-[1320px]">
        {/* =========================================================================
            1. TRAINING LOOP INTRODUCTION
        ========================================================================= */}
        <div className="text-center max-w-[760px] mx-auto mb-16 sm:mb-20">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2.5">
            — THE COMPLETE TRAINING LOOP
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            From your goal to your next breakthrough.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-3.5 leading-relaxed">
            Replyf turns your goals, constraints, and training history into a continuous training loop — so every workout has a purpose and every session gives you something to build on.
          </p>

          {/* 4 Connected Stages Overview Ribbon */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[800px] mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">01 PLAN</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Create your workout</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">02 TRAIN</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Log every set</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">03 TRACK</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">See your progress</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">04 IMPROVE</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">Get smarter steps</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. DESKTOP STICKY SPLIT STORY (hidden on mobile < lg)
        ========================================================================= */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 items-start">
          {/* Left: Scrollable Narrative Copy (col 1-5) */}
          <div className="lg:col-span-5">
            <FeatureCopy
              features={LANDING_FEATURES}
              activeId={activeFeatureId}
              onFeatureSelect={setActiveFeatureId}
            />
          </div>

          {/* Right: Sticky Visual Pinned (col 6-12) */}
          <div className="lg:col-span-7 sticky top-[110px] h-[74vh] flex items-center justify-center">
            <div
              ref={stickyVisualRef}
              className="w-full rounded-3xl bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm overflow-hidden"
            >
              <FeatureVisual activeId={activeFeatureId} />
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. MOBILE STACKED EXPERIENCE (visible < lg)
        ========================================================================= */}
        <div className="lg:hidden space-y-12">
          {LANDING_FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-md space-y-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-indigo-600 text-white">
                  {feature.stepNumber}
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {feature.label}
                </span>
              </div>

              {/* Dedicated Visual for this feature */}
              <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-800">
                <FeatureVisual activeId={feature.id} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                  {feature.headline || feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {feature.highlights.map((h) => (
                    <p key={h} className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span>{h}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* =========================================================================
            4. STORY LOOP CLOSURE — AND THEN IT STARTS AGAIN (Image 1, Panel 07)
        ========================================================================= */}
        <div className="mt-20 md:mt-32 pt-16 border-t border-slate-200/80 dark:border-slate-800 text-center max-w-[840px] mx-auto">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            AND THEN IT STARTS AGAIN.
          </p>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Every workout feeds the next one.
          </h3>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-3 leading-relaxed max-w-[620px] mx-auto">
            The work you complete today becomes context for what comes next.
          </p>

          {/* Circular Cycle Diagram */}
          <div className="relative my-10 py-6 max-w-[460px] mx-auto">
            {/* Center Circle */}
            <div className="relative mx-auto w-32 h-32 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border-2 border-dashed border-indigo-300 dark:border-indigo-700 flex flex-col items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none z-10">
              <div className="relative h-8 w-8 rounded-xl overflow-hidden mb-1">
                <Image
                  src="/icons/replyf-logo-gradient.png"
                  alt="Replyf"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover dark:hidden"
                />
                <Image
                  src="/icons/replyf-logo-dark.png"
                  alt="Replyf dark"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover hidden dark:block"
                />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Next</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-tight">Workout</span>
            </div>

            {/* Top: 01 Plan */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span>01 Plan (Create)</span>
            </div>

            {/* Right: 02 Train */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-2 sm:translate-x-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span>02 Train (Log)</span>
            </div>

            {/* Bottom: 03 Track */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span>03 Track (Analyze)</span>
            </div>

            {/* Left: 04 Improve */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-2 sm:-translate-x-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span>04 Improve (Adapt)</span>
            </div>
          </div>

          {/* Slogan */}
          <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            Build it. Train it. Track it. Improve it.
          </p>
        </div>
      </div>
    </section>
  );
}
