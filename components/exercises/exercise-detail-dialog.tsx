/**
 * Exercise Detail Dialog Component
 * 
 * Deep dive modal for exercise breakdown:
 * - Media demonstration & offline fallback
 * - Anatomy & equipment badges
 * - Step-by-step instructions
 * - Form cues & common mistakes (safe, non-medical language)
 * - Deterministic alternatives with swap action
 * - Related exercises
 * - Favorite & Add to Workout buttons
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { Exercise } from '@/types/domain';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';
import {
  X,
  Heart,
  Plus,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExerciseMedia } from './exercise-media';
import { resolveApprovedMediaCandidates } from '@/lib/exercises/media-resolver';

export interface ExerciseDetailDialogProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  onSelectAlternative: (exercise: Exercise) => void;
  onAddToWorkout?: (exercise: Exercise) => void;
}

export function ExerciseDetailDialog({
  exercise,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onSelectAlternative,
  onAddToWorkout,
}: ExerciseDetailDialogProps) {
  // Lock body scroll and handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const mediaCandidates = useMemo(() => {
    if (!exercise) return [];
    return resolveApprovedMediaCandidates(exercise, 'detail');
  }, [exercise]);

  const hasMedia = mediaCandidates.length > 0;

  const alternatives = useMemo(() => {
    if (!exercise) return [];
    if (!hasMedia) {
      const mediaAlts = ExerciseCatalog.findAlternativesWithMedia(exercise.id);
      if (mediaAlts.length > 0) return mediaAlts;
      return ExerciseCatalog.findAlternatives(exercise.id);
    }
    const directAlts = ExerciseCatalog.findAlternatives(exercise.id);
    if (directAlts.length > 0) return directAlts;
    return ExerciseCatalog.findAlternativesWithMedia(exercise.id);
  }, [exercise, hasMedia]);

  const alternativesWithCandidates = useMemo(() => {
    return alternatives.map((alt) => {
      const candidates = resolveApprovedMediaCandidates(alt, 'card');
      return {
        alt,
        candidates,
        hasApprovedMedia: candidates.length > 0,
        primaryCandidate: candidates.length > 0 ? candidates[0] : null,
      };
    });
  }, [alternatives]);

  const hasAlternativesWithDemonstration = useMemo(() => {
    return alternativesWithCandidates.some((item) => item.hasApprovedMedia);
  }, [alternativesWithCandidates]);

  const relatedExercises = useMemo(() => {
    if (!exercise) return [];
    return ExerciseCatalog.findRelatedExercises(exercise.id);
  }, [exercise]);

  if (!isOpen || !exercise) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="space-y-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-indigo-600 text-white font-medium text-xs">
                {exercise.primaryMuscles[0] || 'Full Body'}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize border-slate-300 text-slate-700">
                {exercise.difficulty}
              </Badge>
              {exercise.movementPattern && (
                <Badge variant="outline" className="text-xs uppercase tracking-wider text-emerald-700 border-emerald-200 bg-emerald-50">
                  {exercise.movementPattern}
                </Badge>
              )}
            </div>
            <h2 id="exercise-detail-title" className="text-xl sm:text-2xl font-bold text-slate-900">
              {exercise.name}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              onClick={() => onToggleFavorite(exercise.id)}
              aria-label={isFavorite ? `Remove ${exercise.name} from favorites` : `Add ${exercise.name} to favorites`}
              aria-pressed={isFavorite}
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
              className="h-9 w-9 p-0 rounded-full text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Media Demonstration / Illustration */}
          <div className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs">
            <ExerciseMedia
              exercise={exercise}
              context="detail"
              className="w-full aspect-[4/3]"
              showProvenance
            />
          </div>

          {!hasMedia && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-amber-900">
                  Demonstration unavailable for this exercise
                </h4>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  {hasAlternativesWithDemonstration
                    ? 'A photo or video demonstration is not available for this exact variation. You can explore the alternative exercises below which have verified video and image demonstrations.'
                    : 'A photo or video demonstration is not available for this exact variation.'}
                </p>
              </div>
            </div>
          )}

          {/* 2. Structured Metadata Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Equipment</span>
              <span className="font-semibold text-slate-800">{exercise.equipment.join(', ') || 'Bodyweight'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Secondary Muscles</span>
              <span className="font-semibold text-slate-800">
                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0
                  ? exercise.secondaryMuscles.join(', ')
                  : 'None'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Joints Involved</span>
              <span className="font-semibold text-slate-800 capitalize">
                {exercise.joints && exercise.joints.length > 0 ? exercise.joints.join(', ') : 'General'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Default Prescription</span>
              <span className="font-semibold text-slate-800">{exercise.defaultSets || 3} sets • {exercise.defaultReps || '10-12'}</span>
            </div>
          </div>

          {/* 3. Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Step-by-Step Instructions
              </h3>
              <ol className="space-y-2 text-sm text-slate-700">
                {exercise.instructions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 4. Form Cues & Common Mistakes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exercise.formCues && exercise.formCues.length > 0 && (
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Key Form Cues</span>
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-900/90 list-disc list-inside">
                  {exercise.formCues.map((cue, idx) => (
                    <li key={idx} className="leading-relaxed">{cue}</li>
                  ))}
                </ul>
              </div>
            )}

            {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Common Mistakes</span>
                </div>
                <ul className="space-y-1.5 text-xs text-amber-900/90 list-disc list-inside">
                  {exercise.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="leading-relaxed">{mistake}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 5. Alternatives */}
          {alternativesWithCandidates.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  {!hasMedia && hasAlternativesWithDemonstration
                    ? 'Recommended Alternatives (with demonstration)'
                    : 'Exercise Alternatives'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {alternativesWithCandidates.length} available
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {alternativesWithCandidates.map(({ alt, primaryCandidate, hasApprovedMedia }) => {
                  return (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => onSelectAlternative(alt)}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {primaryCandidate?.url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={primaryCandidate.url}
                            alt={alt.name}
                            className="w-12 h-12 rounded-md object-cover bg-slate-100 shrink-0 border border-slate-200"
                            loading="lazy"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 truncate">
                            {alt.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {alt.equipment.join(', ')} • {alt.primaryMuscles.join(', ')}
                          </div>
                          {hasApprovedMedia && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-1 border border-emerald-200">
                              <Video className="w-2.5 h-2.5" />
                              <span>Demo available</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Related Exercises */}
          {relatedExercises.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Related Exercises
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedExercises.map((rel) => (
                  <Button
                    key={rel.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() => onSelectAlternative(rel)}
                  >
                    {rel.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-slate-300"
          >
            Close
          </Button>

          {onAddToWorkout && (
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
              onClick={() => {
                onAddToWorkout(exercise);
                onClose();
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add to Workout</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
