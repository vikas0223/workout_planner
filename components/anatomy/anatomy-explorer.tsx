/**
 * Anatomy Explorer Component
 * 
 * Side-by-side (responsive stacked) visual explorer linking AnatomyMap selection
 * directly to pure ExerciseCatalog query results and ExerciseCard components.
 */

'use client';

import React, { useMemo } from 'react';
import { useAnatomySelection } from '@/hooks/use-anatomy-selection';
import { AnatomyMap } from './anatomy-map';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { Exercise } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, RotateCcw, Sparkles, ShieldCheck } from 'lucide-react';

export interface AnatomyExplorerProps {
  isFavorite: (exerciseId: string) => boolean;
  onToggleFavorite: (exerciseId: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
  onAddToWorkout?: (exercise: Exercise) => void;
}

export function AnatomyExplorer({
  isFavorite,
  onToggleFavorite,
  onSelectExercise,
  onAddToWorkout,
}: AnatomyExplorerProps) {
  const {
    mode,
    sex,
    view,
    selectedRegion,
    hoveredRegion,
    relatedRegionIds,
    setMode,
    setSex,
    setView,
    selectRegion,
    clearSelection,
    setHoveredRegion,
  } = useAnatomySelection();

  // Query pure ExerciseCatalog based on selected anatomy region
  const matchedExercises = useMemo(() => {
    if (!selectedRegion) return [];
    if (selectedRegion.type === 'muscle' && selectedRegion.catalogMuscles) {
      return ExerciseCatalog.queryExercises({ muscles: selectedRegion.catalogMuscles }).exercises;
    }
    if (selectedRegion.type === 'joint' && selectedRegion.catalogJoints) {
      return ExerciseCatalog.queryExercises({ joints: selectedRegion.catalogJoints }).exercises;
    }
    return [];
  }, [selectedRegion]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Interactive Body Canvas (lg: 5 cols) */}
      <div className="lg:col-span-5 w-full">
        <AnatomyMap
          mode={mode}
          sex={sex}
          view={view}
          selectedRegion={selectedRegion}
          hoveredRegion={hoveredRegion}
          relatedRegionIds={relatedRegionIds}
          onModeChange={setMode}
          onSexChange={setSex}
          onViewChange={setView}
          onSelectRegion={selectRegion}
          onHoverRegion={setHoveredRegion}
          onClearSelection={clearSelection}
        />

        {/* Informational Guidance Note */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-500 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <span>
            The anatomy explorer helps discover exercises by anatomical region and movement articulation. It is not intended for medical diagnosis or injury rehabilitation.
          </span>
        </div>
      </div>

      {/* Right Column: Contextual Exercise Discovery Results (lg: 7 cols) */}
      <div className="lg:col-span-7 w-full flex flex-col gap-4">
        {selectedRegion ? (
          <div className="space-y-4">
            {/* Header: Selected Region Banner */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider">
                    {selectedRegion.type === 'muscle' ? 'Target Muscle' : 'Involved Joint'}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {matchedExercises.length} {matchedExercises.length === 1 ? 'exercise' : 'exercises'} found
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {selectedRegion.label}
                </h3>
                {selectedRegion.description && (
                  <p className="text-xs text-slate-600 mt-1 max-w-lg">
                    {selectedRegion.description}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="self-start sm:self-center text-xs border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Clear Selection
              </Button>
            </div>

            {/* Exercise Results Grid */}
            {matchedExercises.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">No exercises found for this region</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Try selecting a different region or exploring other anatomy views.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="mt-4 text-xs"
                >
                  Reset Selection
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchedExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isFavorite={isFavorite(exercise.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={onSelectExercise}
                    onAddToWorkout={onAddToWorkout}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Empty / Initial State */
          <div className="p-12 text-center bg-white/70 backdrop-blur-xs rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center my-auto min-h-[360px]">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Interactive Anatomy Exploration
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md">
              Tap or click any muscle group or joint articulation point on the 3D anatomical silhouette to instantly uncover targeted exercise variations, movements, and form cues.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="text-xs text-indigo-700 bg-indigo-50 border-indigo-200 py-1">
                Chest & Back
              </Badge>
              <Badge variant="outline" className="text-xs text-indigo-700 bg-indigo-50 border-indigo-200 py-1">
                Knees & Hips
              </Badge>
              <Badge variant="outline" className="text-xs text-indigo-700 bg-indigo-50 border-indigo-200 py-1">
                Deltoids & Arms
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
