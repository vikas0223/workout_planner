/**
 * React Hook for Exercise Discovery & Library
 * 
 * Manages 300ms search debounce, multi-faceted filtering (OR within, AND across),
 * favorites-first UI sorting, pagination, and active filter counts.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { ExerciseCatalog, ExerciseFilter } from '@/lib/data/exercise-catalog';
import { Exercise } from '@/types/domain';

export type ExerciseSortOption =
  | 'relevance'
  | 'name-asc'
  | 'name-desc'
  | 'difficulty-asc'
  | 'difficulty-desc'
  | 'favorites-first';

export interface UseExerciseLibraryOptions {
  pageSize?: number;
  favoriteIds?: Set<string>;
}

export function useExerciseLibrary(options: UseExerciseLibraryOptions = {}) {
  const pageSize = options.pageSize || 24;
  const favoriteIds = options.favoriteIds || new Set<string>();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<ExerciseSortOption>('name-asc');
  const [page, setPage] = useState(1);

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFilterChange = () => {
    setPage(1);
  };

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
    handleFilterChange();
  };

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
    handleFilterChange();
  };

  const toggleDifficulty = (diff: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
    handleFilterChange();
  };

  const toggleMovement = (move: string) => {
    setSelectedMovements((prev) =>
      prev.includes(move) ? prev.filter((m) => m !== move) : [...prev, move]
    );
    handleFilterChange();
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
    handleFilterChange();
  };

  const clearFilters = () => {
    setSelectedMuscles([]);
    setSelectedEquipment([]);
    setSelectedDifficulties([]);
    setSelectedMovements([]);
    setSelectedGoals([]);
    setPage(1);
  };

  const clearAll = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    clearFilters();
  };

  const activeFilterCount =
    selectedMuscles.length +
    selectedEquipment.length +
    selectedDifficulties.length +
    selectedMovements.length +
    selectedGoals.length;

  const hasActiveFilters = activeFilterCount > 0 || debouncedSearch.length > 0;

  // Query pure catalog, then apply UI-specific "favorites-first" sort and pagination
  const { paginatedExercises, totalCount } = useMemo(() => {
    const isFavoritesFirst = sortBy === 'favorites-first';
    const catalogSort = isFavoritesFirst ? 'name-asc' : sortBy;

    const filter: ExerciseFilter = {
      searchTerm: debouncedSearch,
      muscles: selectedMuscles.length > 0 ? selectedMuscles : undefined,
      equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
      difficulty: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
      movementPatterns: selectedMovements.length > 0 ? selectedMovements : undefined,
      goals: selectedGoals.length > 0 ? selectedGoals : undefined,
      sortBy: catalogSort,
      // Fetch unpaginated when doing favorites-first to sort full dataset
      offset: isFavoritesFirst ? 0 : (page - 1) * pageSize,
      limit: isFavoritesFirst ? undefined : pageSize,
    };

    const queryResult = ExerciseCatalog.queryExercises(filter);
    let allMatches = queryResult.exercises;

    if (isFavoritesFirst) {
      allMatches = [...allMatches].sort((a, b) => {
        const aFav = favoriteIds.has(a.id) ? 1 : 0;
        const bFav = favoriteIds.has(b.id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        return a.name.localeCompare(b.name);
      });
      const offset = (page - 1) * pageSize;
      return {
        paginatedExercises: allMatches.slice(offset, offset + pageSize),
        totalCount: allMatches.length,
      };
    }

    return {
      paginatedExercises: allMatches,
      totalCount: queryResult.totalCount,
    };
  }, [
    debouncedSearch,
    selectedMuscles,
    selectedEquipment,
    selectedDifficulties,
    selectedMovements,
    selectedGoals,
    sortBy,
    page,
    pageSize,
    favoriteIds,
  ]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    // State
    searchTerm,
    debouncedSearch,
    selectedMuscles,
    selectedEquipment,
    selectedDifficulties,
    selectedMovements,
    selectedGoals,
    sortBy,
    page,
    pageSize,
    totalPages,
    activeFilterCount,
    hasActiveFilters,

    // Query Results
    exercises: paginatedExercises,
    totalCount,
    hasMore: page < totalPages,

    // Setters / Actions
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
  };
}
