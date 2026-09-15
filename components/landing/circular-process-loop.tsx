'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Calendar, Dumbbell, BarChart3, TrendingUp, ArrowDown, RotateCw } from 'lucide-react';

interface ProcessStep {
  id: string;
  stepNumber: string;
  title: string;
  action: string;
  fullLabel: string;
  iconType: 'calendar' | 'dumbbell' | 'chart' | 'trend';
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'plan',
    stepNumber: '01',
    title: 'Plan',
    action: 'Create',
    fullLabel: '01 Plan (Create)',
    iconType: 'calendar',
  },
  {
    id: 'train',
    stepNumber: '02',
    title: 'Train',
    action: 'Log',
    fullLabel: '02 Train (Log)',
    iconType: 'dumbbell',
  },
  {
    id: 'track',
    stepNumber: '03',
    title: 'Track',
    action: 'Analyze',
    fullLabel: '03 Track (Analyze)',
    iconType: 'chart',
  },
  {
    id: 'improve',
    stepNumber: '04',
    title: 'Improve',
    action: 'Adapt',
    fullLabel: '04 Improve (Adapt)',
    iconType: 'trend',
  },
];

export function CircularProcessLoop() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  const renderStepIcon = (type: ProcessStep['iconType']) => {
    switch (type) {
      case 'calendar':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Calendar className="w-6 h-6 stroke-[2.2] text-white" />
          </div>
        );
      case 'dumbbell':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Dumbbell className="w-6 h-6 stroke-[2.2] text-white -rotate-45" />
          </div>
        );
      case 'chart':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <BarChart3 className="w-6 h-6 stroke-[2.2] text-white" />
          </div>
        );
      case 'trend':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[2.2] text-white" />
          </div>
        );
    }
  };

  const renderMobileIcon = (type: ProcessStep['iconType']) => {
    switch (type) {
      case 'calendar':
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Calendar className="w-5 h-5 stroke-[2.2] text-white" />
          </div>
        );
      case 'dumbbell':
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Dumbbell className="w-5 h-5 stroke-[2.2] text-white -rotate-45" />
          </div>
        );
      case 'chart':
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <BarChart3 className="w-5 h-5 stroke-[2.2] text-white" />
          </div>
        );
      case 'trend':
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.2] text-white" />
          </div>
        );
    }
  };

  return (
    <div className="relative w-full my-10 py-6 select-none" aria-label="Replyf Continuous Training Loop">
      {/* Visual accessibility notice */}
      <span className="sr-only">
        Replyf four-step continuous training cycle: 01 Plan (Create) leads to 02 Train (Log), which leads to 03 Track (Analyze), which leads to 04 Improve (Adapt), and loops back to 01 Plan (Create), constantly feeding your Next Workout.
      </span>

      {/* =========================================================================
          1. DESKTOP & TABLET: CLOCKWISE CIRCULAR FLOW (≥ 640px)
      ========================================================================= */}
      <div className="hidden sm:block relative w-full max-w-[660px] aspect-square mx-auto">
        {/* Soft Ambient Glow Behind Hub */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* SVG Circular Track & Animated Clockwise Arcs */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 680 680"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Clockwise Arrowhead Marker */}
            <marker
              id="clockwise-arrowhead"
              viewBox="0 0 12 12"
              refX="8"
              refY="6"
              markerWidth="9"
              markerHeight="9"
              orient="auto"
            >
              <path
                d="M 2 2 L 9 6 L 2 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-500 dark:text-indigo-400"
              />
            </marker>

            {/* Glowing Active Arrowhead Marker */}
            <marker
              id="clockwise-arrowhead-active"
              viewBox="0 0 12 12"
              refX="8"
              refY="6"
              markerWidth="10"
              markerHeight="10"
              orient="auto"
            >
              <path
                d="M 2 2 L 9 6 L 2 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-600 dark:text-indigo-300"
              />
            </marker>
          </defs>

          {/* Inner Concentric Dashed Ring around Hub */}
          <circle
            cx="340"
            cy="340"
            r="115"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeDasharray="5 6"
            className="text-indigo-200/90 dark:text-indigo-800/80"
          />

          {/* ARC 1: 01 Plan → 02 Train (Emerges from Card 01 right, enters Card 02 top) */}
          <path
            id="arc-01-02"
            d="M 451 132 A 236 236 0 0 1 574 304"
            fill="none"
            stroke="currentColor"
            strokeWidth={hoveredStep === 'plan' || hoveredStep === 'train' ? '2.8' : '2.2'}
            strokeDasharray="6 6"
            markerEnd={
              hoveredStep === 'plan' || hoveredStep === 'train'
                ? 'url(#clockwise-arrowhead-active)'
                : 'url(#clockwise-arrowhead)'
            }
            className={`transition-colors duration-200 ${hoveredStep === 'plan' || hoveredStep === 'train'
              ? 'text-indigo-600 dark:text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
              : 'text-indigo-400/90 dark:text-indigo-500/80'
              }`}
            style={{
              animation: 'flowClockwiseDash 1.2s linear infinite',
            }}
          />
          {/* Arc 1 Moving Glow Dot */}
          <circle r="4.5" className="fill-indigo-600 dark:fill-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]">
            <animateMotion
              path="M 451 132 A 236 236 0 0 1 574 304"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>

          {/* ARC 2: 02 Train → 03 Track (Emerges from Card 02 bottom, enters Card 03 right) */}
          <path
            id="arc-02-03"
            d="M 574 376 A 236 236 0 0 1 451 548"
            fill="none"
            stroke="currentColor"
            strokeWidth={hoveredStep === 'train' || hoveredStep === 'track' ? '2.8' : '2.2'}
            strokeDasharray="6 6"
            markerEnd={
              hoveredStep === 'train' || hoveredStep === 'track'
                ? 'url(#clockwise-arrowhead-active)'
                : 'url(#clockwise-arrowhead)'
            }
            className={`transition-colors duration-200 ${hoveredStep === 'train' || hoveredStep === 'track'
              ? 'text-indigo-600 dark:text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
              : 'text-indigo-400/90 dark:text-indigo-500/80'
              }`}
            style={{
              animation: 'flowClockwiseDash 1.2s linear infinite',
            }}
          />
          {/* Arc 2 Moving Glow Dot */}
          <circle r="4.5" className="fill-indigo-600 dark:fill-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]">
            <animateMotion
              path="M 574 376 A 236 236 0 0 1 451 548"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>

          {/* ARC 3: 03 Track → 04 Improve (Emerges from Card 03 left, enters Card 04 bottom) */}
          <path
            id="arc-03-04"
            d="M 229 548 A 236 236 0 0 1 106 376"
            fill="none"
            stroke="currentColor"
            strokeWidth={hoveredStep === 'track' || hoveredStep === 'improve' ? '2.8' : '2.2'}
            strokeDasharray="6 6"
            markerEnd={
              hoveredStep === 'track' || hoveredStep === 'improve'
                ? 'url(#clockwise-arrowhead-active)'
                : 'url(#clockwise-arrowhead)'
            }
            className={`transition-colors duration-200 ${hoveredStep === 'track' || hoveredStep === 'improve'
              ? 'text-indigo-600 dark:text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
              : 'text-indigo-400/90 dark:text-indigo-500/80'
              }`}
            style={{
              animation: 'flowClockwiseDash 1.2s linear infinite',
            }}
          />
          {/* Arc 3 Moving Glow Dot */}
          <circle r="4.5" className="fill-indigo-600 dark:fill-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]">
            <animateMotion
              path="M 229 548 A 236 236 0 0 1 106 376"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>

          {/* ARC 4: 04 Improve → 01 Plan (Emerges from Card 04 top, enters Card 01 left) */}
          <path
            id="arc-04-01"
            d="M 106 304 A 236 236 0 0 1 229 132"
            fill="none"
            stroke="currentColor"
            strokeWidth={hoveredStep === 'improve' || hoveredStep === 'plan' ? '2.8' : '2.2'}
            strokeDasharray="6 6"
            markerEnd={
              hoveredStep === 'improve' || hoveredStep === 'plan'
                ? 'url(#clockwise-arrowhead-active)'
                : 'url(#clockwise-arrowhead)'
            }
            className={`transition-colors duration-200 ${hoveredStep === 'improve' || hoveredStep === 'plan'
              ? 'text-indigo-600 dark:text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
              : 'text-indigo-400/90 dark:text-indigo-500/80'
              }`}
            style={{
              animation: 'flowClockwiseDash 1.2s linear infinite',
            }}
          />
          {/* Arc 4 Moving Glow Dot */}
          <circle r="4.5" className="fill-indigo-600 dark:fill-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]">
            <animateMotion
              path="M 106 304 A 236 236 0 0 1 229 132"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        {/* Center Hub: Next Workout Outcome (Stable, Non-Rotating) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/30 mb-2 shrink-0">
            <Image
              src="/icons/replyf-logo-gradient.png"
              alt="Replyf Next Workout Hub"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">Next</span>
          <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 leading-tight">Workout</span>
        </div>

        {/* CARD 01: Plan (Create) — TOP */}
        <div
          className="absolute top-[9%] left-1/2 -translate-x-1/2 z-20"
          onMouseEnter={() => setHoveredStep('plan')}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <div className="rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08),0_4px_10px_-2px_rgba(0,0,0,0.04)] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 cursor-default">
            {renderStepIcon('calendar')}
            <div className="flex flex-col text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 text-[11px] font-black text-indigo-600 dark:text-indigo-400 w-fit mb-0.5">
                01
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Plan (Create)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 02: Train (Log) — RIGHT */}
        <div
          className="absolute top-1/2 right-[1%] -translate-y-1/2 z-20"
          onMouseEnter={() => setHoveredStep('train')}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <div className="rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08),0_4px_10px_-2px_rgba(0,0,0,0.04)] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 cursor-default">
            {renderStepIcon('dumbbell')}
            <div className="flex flex-col text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 text-[11px] font-black text-indigo-600 dark:text-indigo-400 w-fit mb-0.5">
                02
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Train (Log)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 03: Track (Analyze) — BOTTOM */}
        <div
          className="absolute bottom-[9%] left-1/2 -translate-x-1/2 z-20"
          onMouseEnter={() => setHoveredStep('track')}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <div className="rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08),0_4px_10px_-2px_rgba(0,0,0,0.04)] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 cursor-default">
            {renderStepIcon('chart')}
            <div className="flex flex-col text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 text-[11px] font-black text-indigo-600 dark:text-indigo-400 w-fit mb-0.5">
                03
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Track (Analyze)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 04: Improve (Adapt) — LEFT */}
        <div
          className="absolute top-1/2 left-[1%] -translate-y-1/2 z-20"
          onMouseEnter={() => setHoveredStep('improve')}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <div className="rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08),0_4px_10px_-2px_rgba(0,0,0,0.04)] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 cursor-default">
            {renderStepIcon('trend')}
            <div className="flex flex-col text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 text-[11px] font-black text-indigo-600 dark:text-indigo-400 w-fit mb-0.5">
                04
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Improve (Adapt)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MOBILE: RESPONSIVE CONTINUOUS VERTICAL LOOP (< 640px)
      ========================================================================= */}
      <div className="sm:hidden relative w-full max-w-[360px] mx-auto pt-2 pb-6">
        {/* Mobile Central Hub Badge */}
        <div className="flex items-center justify-center gap-3 mb-6 p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0">
            <Image
              src="/icons/replyf-logo-gradient.png"
              alt="Replyf Next Workout Hub"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Next Workout Hub</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block">Continuous Training Loop</span>
          </div>
        </div>

        {/* Step Cards with Connected Directional Connectors */}
        <div className="relative pl-6 space-y-4">
          {/* Vertical Connecting Rail */}
          <div
            className="absolute left-[39px] top-6 bottom-6 w-[2px] border-l-2 border-dashed border-indigo-400/80 dark:border-indigo-500/80 z-0"
            style={{
              animation: 'flowVerticalDash 1.2s linear infinite',
            }}
          />

          {PROCESS_STEPS.map((step, index) => (
            <div key={step.id} className="relative z-10">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-3.5 flex items-center gap-3">
                {renderMobileIcon(step.iconType)}
                <div className="flex flex-col text-left">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-[10px] font-black text-indigo-600 dark:text-indigo-400 w-fit mb-0.5">
                    {step.stepNumber}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {step.title} ({step.action})
                  </span>
                </div>
              </div>

              {/* Animated Arrow Down (for steps 1 to 3) */}
              {index < PROCESS_STEPS.length - 1 && (
                <div className="flex justify-start pl-[7px] py-1">
                  <ArrowDown className="w-4 h-4 text-indigo-500 animate-bounce" />
                </div>
              )}
            </div>
          ))}

          {/* Loop Return to 01 Indicator */}
          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 pl-2">
            <RotateCw className="w-4 h-4 animate-spin [animation-duration:4s]" />
            <span>Loops back to 01 Plan (Create)</span>
          </div>
        </div>
      </div>

      {/* Keyframe Styles for Clockwise & Vertical Dashed Animation */}
      <style jsx>{`
        @keyframes flowClockwiseDash {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes flowVerticalDash {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 24px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          path {
            animation: none !important;
          }
          circle {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
