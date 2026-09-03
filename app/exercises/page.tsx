/**
 * Exercise Discovery & Library Page
 * Route: /exercises
 * 
 * Local-first, production-quality exercise discovery:
 * - Tab 1: Comprehensive Filter & Search Grid
 * - Tab 2: Interactive Muscle & Joint Anatomy Explorer
 * - Pure ExerciseCatalog discovery queries
 * - Offline favorites & detail breakdowns
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExerciseLibrary, ExerciseSortOption } from '@/hooks/use-exercise-library';
import { useExerciseFavorites } from '@/hooks/use-exercise-favorites';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { ExerciseFilters } from '@/components/exercises/exercise-filters';
import { ExerciseFilterDrawer } from '@/components/exercises/exercise-filter-drawer';
import dynamic from 'next/dynamic';
import { Exercise } from '@/types/domain';

const AnatomyExplorer = dynamic(
  () => import('@/components/anatomy/anatomy-explorer').then((mod) => mod.AnatomyExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading Interactive Anatomy Explorer...</p>
      </div>
    ),
  }
);

const ExerciseDetailDialog = dynamic(
  () => import('@/components/exercises/exercise-detail-dialog').then((mod) => mod.ExerciseDetailDialog),
  { ssr: false }
);
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowLeft,
  Dumbbell,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Check,
  LayoutGrid,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ExerciseLibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'library' | 'anatomy'>('library');

  const { favoriteIds, isFavorite, toggleFavorite } = useExerciseFavorites('guest_user');

  const {
    searchTerm,
    selectedMuscles,
    selectedEquipment,
    selectedDifficulties,
    selectedMovements,
    selectedGoals,
    sortBy,
    page,
    totalPages,
    activeFilterCount,
    hasActiveFilters,
    exercises,
    totalCount,
    setSearchTerm,
    setSortBy,
    setPage,
    toggleMuscle,
    toggleEquipment,
    toggleDifficulty,
    toggleMovement,
    toggleGoal,
    clearFilters,
    clearAll,
  } = useExerciseLibrary({ pageSize: 24, favoriteIds });

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const handleOpenDetail = (ex: Exercise) => {
    setSelectedExercise(ex);
    setIsDetailOpen(true);
  };

  const handleSelectAlternative = (altEx: Exercise) => {
    setSelectedExercise(altEx);
  };

  /**
   * Add to Workout Integration Boundary
   */
  const handleAddToWorkout = (ex: Exercise) => {
    setAddedToast(`Added ${ex.name} to workout session`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30 text-slate-900 pb-20">
      {/* Toast Notification */}
      {addedToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg animate-in slide-in-from-bottom-3 duration-300 motion-reduce:animate-none"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-slate-600 hover:text-slate-900 -ml-2"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                <Dumbbell className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Exercise Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs hidden sm:flex"
            >
              Dashboard
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => router.push('/')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Generate Plan
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'library' ? 'Exercise Library' : 'Interactive Anatomy Map'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {activeTab === 'library'
                ? `Search and filter ${totalCount} exercises with structured movements, equipment, and difficulty levels.`
                : 'Select muscle groups and joint articulation points to visually discover matching exercises.'}
            </p>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl shadow-inner self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              aria-pressed={activeTab === 'library'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'library'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Catalog List</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('anatomy')}
              aria-pressed={activeTab === 'anatomy'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'anatomy'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Anatomy Explorer</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CATALOG LIST VIEW */}
        {activeTab === 'library' && (
          <div className="mt-4">
            {/* Search Bar & Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exercises, aliases, muscles, equipment, movement..."
                  aria-label="Search exercises"
                  className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="h-10 px-4 border-slate-200 bg-white md:hidden text-slate-700 flex items-center gap-2 text-xs"
                  aria-label="Open filter options"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge className="bg-indigo-600 text-white text-[11px] px-1.5 py-0.2 rounded-full">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ExerciseSortOption)}
                  aria-label="Sort exercises by"
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                >
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                  <option value="favorites-first">Favorites First</option>
                  <option value="difficulty-asc">Difficulty: Beginner First</option>
                  <option value="difficulty-desc">Difficulty: Advanced First</option>
                  <option value="relevance">Relevance</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-medium text-slate-500">Active filters:</span>
                {selectedMuscles.map((m) => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 text-xs py-0.5"
                  >
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => toggleMuscle(m)}
                      aria-label={`Remove ${m} filter`}
                      className="hover:text-indigo-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {selectedEquipment.map((eq) => (
                  <Badge
                    key={eq}
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 text-xs py-0.5"
                  >
                    <span>{eq}</span>
                    <button
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      aria-label={`Remove ${eq} filter`}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {selectedDifficulties.map((diff) => (
                  <Badge
                    key={diff}
                    variant="outline"
                    className="bg-slate-100 text-slate-800 border-slate-300 flex items-center gap-1 text-xs capitalize py-0.5"
                  >
                    <span>{diff}</span>
                    <button
                      type="button"
                      onClick={() => toggleDifficulty(diff)}
                      aria-label={`Remove ${diff} filter`}
                      className="hover:text-slate-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {selectedMovements.map((move) => (
                  <Badge
                    key={move}
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 text-xs capitalize py-0.5"
                  >
                    <span>{move}</span>
                    <button
                      type="button"
                      onClick={() => toggleMovement(move)}
                      aria-label={`Remove ${move} filter`}
                      className="hover:text-emerald-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {selectedGoals.map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className="bg-indigo-50 text-indigo-800 border-indigo-200 flex items-center gap-1 text-xs capitalize py-0.5"
                  >
                    <span>{g}</span>
                    <button
                      type="button"
                      onClick={() => toggleGoal(g)}
                      aria-label={`Remove ${g} filter`}
                      className="hover:text-indigo-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-6 px-2 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                >
                  Clear all
                </Button>
              </div>
            )}

            {/* Content Layout (Sidebar + Exercise Grid) */}
            <div className="mt-4 flex gap-6 items-start">
              {/* Desktop Filter Sidebar */}
              <aside className="hidden md:block w-64 shrink-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sticky top-24">
                <ExerciseFilters
                  selectedMuscles={selectedMuscles}
                  selectedEquipment={selectedEquipment}
                  selectedDifficulties={selectedDifficulties}
                  selectedMovements={selectedMovements}
                  selectedGoals={selectedGoals}
                  onToggleMuscle={toggleMuscle}
                  onToggleEquipment={toggleEquipment}
                  onToggleDifficulty={toggleDifficulty}
                  onToggleMovement={toggleMovement}
                  onToggleGoal={toggleGoal}
                  onClearAll={clearFilters}
                  activeFilterCount={activeFilterCount}
                />
              </aside>

              {/* Exercise Grid Area */}
              <div className="flex-1 min-w-0">
                {/* Results Count Header */}
                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Showing {exercises.length} of {totalCount} exercises</span>
                  {totalPages > 1 && (
                    <span>Page {page} of {totalPages}</span>
                  )}
                </div>

                {/* Grid or Empty State */}
                {exercises.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <FilterX className="w-7 h-7" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">No exercises found</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      Try removing some filters or adjusting your search term to find what you&apos;re looking for.
                    </p>
                    <div className="mt-5 flex justify-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearAll}
                        className="border-slate-300 text-xs"
                      >
                        Reset all filters
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exercises.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        isFavorite={isFavorite(exercise.id)}
                        onToggleFavorite={toggleFavorite}
                        onSelect={handleOpenDetail}
                        onAddToWorkout={handleAddToWorkout}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="border-slate-200 text-slate-700 text-xs"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-xs font-medium text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="border-slate-200 text-slate-700 text-xs"
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE ANATOMY EXPLORER */}
        {activeTab === 'anatomy' && (
          <div className="mt-4">
            <AnatomyExplorer
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onSelectExercise={handleOpenDetail}
              onAddToWorkout={handleAddToWorkout}
            />
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      <ExerciseFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        totalResults={totalCount}
        selectedMuscles={selectedMuscles}
        selectedEquipment={selectedEquipment}
        selectedDifficulties={selectedDifficulties}
        selectedMovements={selectedMovements}
        selectedGoals={selectedGoals}
        onToggleMuscle={toggleMuscle}
        onToggleEquipment={toggleEquipment}
        onToggleDifficulty={toggleDifficulty}
        onToggleMovement={toggleMovement}
        onToggleGoal={toggleGoal}
        onClearAll={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Exercise Detail Dialog */}
      <ExerciseDetailDialog
        exercise={selectedExercise}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedExercise(null);
        }}
        isFavorite={selectedExercise ? isFavorite(selectedExercise.id) : false}
        onToggleFavorite={toggleFavorite}
        onSelectAlternative={handleSelectAlternative}
        onAddToWorkout={handleAddToWorkout}
      />
    </div>
  );
}
