/**
 * Reusable Exercise Picker Modal Component
 * 
 * Provides search, faceted filtering, and Phase 2G Interactive Anatomy Map selection
 * for adding or replacing exercises in WorkoutBuilder and live WorkoutSession.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Exercise, AnatomyRegionDefinition } from '@/types/domain';
import { ExerciseCatalog, ExerciseFilter } from '@/lib/data/exercise-catalog';
import { useAnatomySelection } from '@/hooks/use-anatomy-selection';
import { AnatomyMap } from '@/components/anatomy/anatomy-map';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Dumbbell, Activity, LayoutGrid, Sparkles, Check } from 'lucide-react';

export interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  replacingExerciseName?: string;
}

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelectExercise,
  replacingExerciseName,
}: ExercisePickerModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'anatomy'>('catalog');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  // Anatomy state hook
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

  // Query catalog based on active tab & filters
  const exercises = useMemo(() => {
    if (activeTab === 'anatomy' && selectedRegion) {
      if (selectedRegion.type === 'muscle' && selectedRegion.catalogMuscles) {
        return ExerciseCatalog.queryExercises({ muscles: selectedRegion.catalogMuscles }).exercises;
      }
      if (selectedRegion.type === 'joint' && selectedRegion.catalogJoints) {
        return ExerciseCatalog.queryExercises({ joints: selectedRegion.catalogJoints }).exercises;
      }
      return [];
    }

    const filter: ExerciseFilter = {
      searchTerm: searchTerm.trim() || undefined,
      muscles: selectedMuscle ? [selectedMuscle] : undefined,
      equipment: selectedEquipment ? [selectedEquipment] : undefined,
      difficulty: selectedDifficulty as any,
    };

    return ExerciseCatalog.queryExercises(filter).exercises;
  }, [activeTab, selectedRegion, searchTerm, selectedMuscle, selectedEquipment, selectedDifficulty]);

  const handleSelect = (ex: Exercise) => {
    onSelectExercise(ex);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl bg-white">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-indigo-600" />
              {replacingExerciseName ? `Replace "${replacingExerciseName}"` : 'Select Exercise'}
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse the exercise catalog or tap the interactive anatomy silhouette.
            </p>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('anatomy')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'anatomy'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Anatomy</span>
            </button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: CATALOG LIST */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, muscle, equipment..."
                  aria-label="Search exercise catalog"
                  className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Abs'].map(
                  (m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMuscle(selectedMuscle === m ? null : m)}
                      className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        selectedMuscle === m
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE ANATOMY */}
          {activeTab === 'anatomy' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-5">
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
              </div>

              <div className="md:col-span-7">
                {selectedRegion ? (
                  <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                        Selected Region
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{selectedRegion.label}</h4>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-xs text-indigo-700 h-7 px-2"
                    >
                      Reset
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                    Tap any muscle or joint on the silhouette to display matching exercises.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exercise Results List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Available Exercises ({exercises.length})
            </div>

            {exercises.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No exercises found matching your current selection.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{ex.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-slate-50">
                          {ex.primaryMuscles[0]}
                        </Badge>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500 capitalize">{ex.difficulty}</span>
                        {ex.equipment[0] && (
                          <>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] text-slate-500">{ex.equipment[0]}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSelect(ex)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 rounded-xl shadow-xs shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
