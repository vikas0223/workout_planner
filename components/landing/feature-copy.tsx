/**
 * Feature Story Copy Column (Part 11, 15, 16)
 *
 * Renders the four feature articles (Plan, Train, Track, Improve)
 * with clear visual hierarchy, step badges, and highlights.
 */

'use client';

import React from 'react';
import { LandingFeature, LandingFeatureId } from '@/lib/landing/landing-features';
import { Check } from 'lucide-react';

export interface FeatureCopyProps {
  features: LandingFeature[];
  activeId: LandingFeatureId;
  onFeatureSelect: (id: LandingFeatureId) => void;
}

export function FeatureCopy({ features, activeId, onFeatureSelect }: FeatureCopyProps) {
  return (
    <div className="feature-copy-container flex flex-col space-y-16 lg:space-y-32 py-8 lg:py-16">
      {features.map((feature) => {
        const isActive = activeId === feature.id;
        return (
          <article
            key={feature.id}
            data-feature={feature.id}
            tabIndex={0}
            onClick={() => onFeatureSelect(feature.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFeatureSelect(feature.id);
              }
            }}
            className={`feature-article-card transition-all duration-300 cursor-pointer rounded-3xl p-6 sm:p-8 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
              isActive
                ? 'bg-white border-indigo-200/90 shadow-md ring-1 ring-indigo-500/10'
                : 'bg-white/40 border-slate-200/60 hover:bg-white/70 hover:border-slate-300'
            }`}
          >
            {/* Step badge */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {feature.stepNumber}
              </span>
              <span
                className={`text-xs font-bold tracking-wider uppercase ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                {feature.label}
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-3">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="text-base text-slate-600 leading-relaxed mb-5">
              {feature.description}
            </p>

            {/* Feature Highlights */}
            <ul className="space-y-2 pt-2 border-t border-slate-100">
              {feature.highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                  <div className="h-4 w-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
