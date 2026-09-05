/* eslint-disable @next/next/no-img-element */
/**
 * Canonical Exercise Media Component
 *
 * Responsibilities:
 * - Deterministic media resolution: GIF/animation -> Video -> SVG -> Static Image -> thumbnailUrl -> mediaUrl -> neutral fallback
 * - Strict aspect-[4/3] reservation to eliminate Cumulative Layout Shift (CLS = 0)
 * - Context support: 'card' | 'detail' | 'picker' | 'session'
 * - Graceful runtime error resilience: failed assets trigger fallback to next candidate until neutral fallback
 * - Accessible descriptions and decorative safety
 * - Zero external library dependency / no persistence modification
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Exercise } from '@/types/domain';
import { Dumbbell, ImageOff, ShieldCheck } from 'lucide-react';
import {
  ExerciseMediaContext,
  resolveMediaCandidates,
  resolveActiveCandidate,
} from '@/lib/exercises/media-resolver';

export type { ExerciseMediaContext };
export { resolveMediaCandidates, resolveActiveCandidate };

export interface ExerciseMediaProps {
  exercise: Exercise;
  context?: ExerciseMediaContext;
  className?: string;
  showProvenance?: boolean;
  priority?: boolean;
}

export function ExerciseMedia({
  exercise,
  context = 'card',
  className = '',
  showProvenance = false,
  priority = false,
}: ExerciseMediaProps) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const candidates = useMemo(() => {
    return resolveMediaCandidates(exercise, context);
  }, [exercise, context]);

  // Find highest-priority candidate that has not failed
  const activeCandidate = useMemo(() => {
    return resolveActiveCandidate(candidates, failedUrls);
  }, [candidates, failedUrls]);

  const handleMediaError = useCallback((url: string) => {
    setFailedUrls((prev) => {
      const updated = new Set(prev);
      updated.add(url);
      return updated;
    });
  }, []);

  const handleMediaLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Primary accessibility alt description
  const altText = `${exercise.name} exercise demonstration`;

  // Provenance label
  const licenseLabel = activeCandidate?.license || exercise.provenance?.license || 'CC-BY-4.0';
  const shouldRenderProvenance = (showProvenance || context === 'detail') && !!licenseLabel;

  // Frame sizing according to context
  const containerClasses = [
    'relative w-full aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 select-none pointer-events-none',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // 1. NEUTRAL FALLBACK (when no candidate exists or all candidates failed)
  if (!activeCandidate) {
    return (
      <div
        className={containerClasses}
        data-testid="exercise-media-fallback"
        role="img"
        aria-label={`${exercise.name} demonstration unavailable`}
      >
        <div className="flex flex-col items-center justify-center text-center p-3 text-slate-500 w-full h-full bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/60">
          <div className="h-9 w-9 rounded-full bg-white shadow-xs flex items-center justify-center mb-1.5 text-slate-400 border border-slate-200/80">
            {context === 'card' ? (
              <Dumbbell className="w-4 h-4 text-slate-500" />
            ) : (
              <ImageOff className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-700 line-clamp-1">
            Exercise demonstration unavailable
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-[90%]">
            {exercise.primaryMuscles.join(', ')}
            {exercise.equipment && exercise.equipment.length > 0 ? ` • ${exercise.equipment.join(', ')}` : ''}
          </span>
        </div>
      </div>
    );
  }

  // 2. VIDEO RENDERING
  if (activeCandidate.type === 'video') {
    return (
      <div
        className={containerClasses}
        data-testid="exercise-media-video"
      >
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" aria-hidden="true" />
        )}
        <video
          src={activeCandidate.url}
          poster={activeCandidate.posterUrl}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={handleMediaLoad}
          onError={() => handleMediaError(activeCandidate.url)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label={altText}
        />
        {shouldRenderProvenance && (
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200 flex items-center gap-1 shadow-xs">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>{licenseLabel}</span>
          </div>
        )}
      </div>
    );
  }

  // 3. IMAGE / SVG / ANIMATION (GIF) RENDERING
  return (
    <div
      className={containerClasses}
      data-testid="exercise-media-image"
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" aria-hidden="true" />
      )}
      <img
        src={activeCandidate.url}
        alt={altText}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleMediaLoad}
        onError={() => handleMediaError(activeCandidate.url)}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {shouldRenderProvenance && (
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200 flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>{licenseLabel}</span>
        </div>
      )}
    </div>
  );
}
