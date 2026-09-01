/**
 * React Hook for Exercise Favorites Management
 * 
 * Backed by LocalFavoritesRepository & IndexedDB.
 * Works seamlessly offline.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocalFavoritesRepository } from '@/lib/repositories/local/local-favorites-repository';

export function useExerciseFavorites(userId: string = 'guest_user') {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const repo = new LocalFavoritesRepository();

  const loadFavorites = useCallback(async () => {
    try {
      const list = await repo.listFavorites(userId);
      setFavoriteIds(new Set(list));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(
    async (exerciseId: string) => {
      const isCurrentlyFav = favoriteIds.has(exerciseId);
      const nextSet = new Set(favoriteIds);

      if (isCurrentlyFav) {
        nextSet.delete(exerciseId);
        setFavoriteIds(nextSet);
        try {
          await repo.removeFavorite(exerciseId, userId);
        } catch {
          // Revert on error
          setFavoriteIds(favoriteIds);
        }
      } else {
        nextSet.add(exerciseId);
        setFavoriteIds(nextSet);
        try {
          await repo.addFavorite(exerciseId, userId);
        } catch {
          // Revert on error
          setFavoriteIds(favoriteIds);
        }
      }
    },
    [favoriteIds, userId]
  );

  const isFavorite = useCallback(
    (exerciseId: string) => {
      return favoriteIds.has(exerciseId);
    },
    [favoriteIds]
  );

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    isLoading,
    refreshFavorites: loadFavorites,
  };
}
