/**
 * Feature Story Interactive Section (Part 10, 12, 15, 18, 19, 20)
 *
 * Signature feature section:
 * - Desktop (≥ 768px): Sticky split layout (40% copy / 60% pinned visual)
 *   with GSAP ScrollTrigger driving transitions across Plan, Train, Track, Improve.
 * - Mobile (< 768px): Clean vertical stack without sticky constraints.
 * - React cleanup via gsap.context() and reduced-motion support.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LANDING_FEATURES, LandingFeatureId } from '@/lib/landing/landing-features';
import { FeatureCopy } from './feature-copy';
import { FeatureVisual } from './feature-visual';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
          start: 'top 60%',
          end: 'bottom 40%',
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
      className="relative w-full px-4 sm:px-6 py-16 md:py-24 scroll-mt-24 border-b border-slate-200/60"
      aria-label="Features Story"
    >
      <div className="mx-auto max-w-[1320px]">
        {/* Section Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
            The Complete Training Loop
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Stop guessing what to do next.
          </h2>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            Replyf turns your goals, constraints, and training history into structured workouts and clear progressive overload.
          </p>
        </div>

        {/* DESKTOP STICKY SPLIT LAYOUT (hidden on mobile < lg) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 items-start">
          {/* Left: Scrollable Copy (col 1-5) */}
          <div className="lg:col-span-5">
            <FeatureCopy
              features={LANDING_FEATURES}
              activeId={activeFeatureId}
              onFeatureSelect={setActiveFeatureId}
            />
          </div>

          {/* Right: Sticky Visual Pinned (col 6-12) */}
          <div className="lg:col-span-7 sticky top-[12vh] h-[76vh] flex items-center justify-center">
            <div
              ref={stickyVisualRef}
              className="w-full rounded-3xl bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50 border border-slate-200/80 p-6 shadow-sm overflow-hidden"
            >
              <FeatureVisual activeId={activeFeatureId} />
            </div>
          </div>
        </div>

        {/* MOBILE STACKED EXPERIENCE (visible < lg) */}
        <div className="lg:hidden space-y-12">
          {LANDING_FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-md space-y-6"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-indigo-600 text-white">
                  {feature.stepNumber}
                </span>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {feature.label}
                </span>
              </div>

              {/* Dedicated Visual for this feature */}
              <div className="rounded-2xl bg-slate-50/80 p-2 border border-slate-100">
                <FeatureVisual activeId={feature.id} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {feature.highlights.map((h) => (
                    <p key={h} className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span>{h}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
