/**
 * Landing Page Hero Section (Part 10, 11, 12, 13, 21, 22)
 *
 * Primary consumer hook:
 * - Eyebrow: "Local-first fitness"
 * - Headline: "Stop guessing what to do next."
 * - Subheadline: "Build workouts in seconds, log every set, and turn your training history into clear next steps — all in one fast, local-first fitness app."
 * - Supporting: "Plans adapt to your training, not the other way around."
 * - Primary CTA: "Start Training" (routes to /)
 * - Secondary CTA: "Install Replyf"
 * - Right column: High-fidelity Replyf Workout Preview card with realistic exercises
 */

'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play, CheckCircle2, Clock, Dumbbell, ShieldCheck } from 'lucide-react';
import { InstallReplyfButton } from './install-replyf-button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Fast, lightweight entrance stagger (500-700ms total)
      gsap.from('.hero-anim-item', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
      });

      // Subtle parallax on the product mockup
      if (visualRef.current) {
        gsap.to(visualRef.current, {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative pt-8 pb-16 md:pt-14 md:pb-24 px-4 sm:px-6 overflow-hidden"
      aria-label="Hero"
    >
      <div className="mx-auto max-w-[1320px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* LEFT COLUMN: Editorial Value Proposition (col 1-7) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          {/* Eyebrow badge */}
          <div className="hero-anim-item inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-100 text-xs font-bold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Local-first fitness</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-anim-item text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] max-w-[680px]">
            Stop guessing what to do next.
          </h1>

          {/* Subheadline */}
          <p className="hero-anim-item text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-[620px]">
            Build workouts in seconds, log every set, and turn your training history into clear next steps — all in one fast, local-first fitness app.
          </p>

          {/* Supporting adaptive statement */}
          <p className="hero-anim-item text-sm font-semibold text-indigo-600/90 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Plans adapt to your training, not the other way around.</span>
          </p>

          {/* CTA Actions */}
          <div className="hero-anim-item flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto pt-2">
            <Link
              href="/"
              className="min-h-[48px] px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-base font-bold shadow-md shadow-indigo-200 transition-all duration-150 inline-flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <span>Start Training</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>

            <InstallReplyfButton variant="secondary" size="lg" />
          </div>

          {/* Micro-trust copy */}
          <p className="hero-anim-item text-xs text-slate-500 font-medium">
            Free · No app store required · Works offline
          </p>
        </div>

        {/* RIGHT COLUMN: Realistic Live Workout Product UI (col 8-12) */}
        <div className="lg:col-span-5 w-full">
          <div
            ref={visualRef}
            className="hero-anim-item relative mx-auto max-w-[440px] lg:max-w-none rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 sm:p-6 shadow-xl shadow-indigo-100/50"
          >
            {/* Header / Session metadata */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-sm shadow-indigo-200 shrink-0">
                  <Image
                    src="/icons/icon-192x192.png"
                    alt="Replyf workout logo"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">Full Body Hypertrophy</h2>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      45 min
                    </span>
                    <span>•</span>
                    <span className="text-indigo-600 font-semibold">Intermediate</span>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Ready
              </span>
            </div>

            {/* Exercise List */}
            <div className="py-4 space-y-3">
              {/* Exercise 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Barbell Back Squat</span>
                    <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">Quads</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">3 sets × 10 reps @ 85 kg</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3 / 3</span>
                </div>
              </div>

              {/* Exercise 2 (Active) */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 ring-2 ring-indigo-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-indigo-950">Bench Press</span>
                    <span className="text-[10px] text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">Chest</span>
                  </div>
                  <p className="text-[11px] text-indigo-700/80 mt-1 font-medium">3 sets × 8 reps @ 75 kg</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
                  <span>Set 2 of 3</span>
                </div>
              </div>

              {/* Exercise 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Barbell Bent-Over Row</span>
                    <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">Back</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">3 sets × 10 reps @ 60 kg</p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Pending</span>
              </div>
            </div>

            {/* Bottom Live Action */}
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/"
                className="w-full min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START WORKOUT</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
