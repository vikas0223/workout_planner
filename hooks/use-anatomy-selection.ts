/**
 * React Hook for Anatomy Map Selection State
 * 
 * Manages view mode (muscle/joint), sex (male/female), perspective (front/back),
 * active selection, hovered region, and related muscle highlighting.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  AnatomyMode,
  BodySex,
  BodyView,
  AnatomyRegionDefinition,
} from '@/types/domain';
import { getRegionsByViewAndMode, findRelatedRegions } from '@/lib/anatomy/anatomy-definitions';

export function useAnatomySelection() {
  const [mode, setModeState] = useState<AnatomyMode>('muscle');
  const [sex, setSex] = useState<BodySex>('male');
  const [view, setViewState] = useState<BodyView>('front');
  const [selectedRegion, setSelectedRegion] = useState<AnatomyRegionDefinition | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<AnatomyRegionDefinition | null>(null);

  // Set mode: clears incompatible selection
  const setMode = useCallback((newMode: AnatomyMode) => {
    setModeState((prev) => {
      if (prev !== newMode) {
        setSelectedRegion(null);
        setHoveredRegion(null);
      }
      return newMode;
    });
  }, []);

  // Set view: clears selection if the region does not exist in the new view
  const setView = useCallback((newView: BodyView) => {
    setViewState((prev) => {
      if (prev !== newView) {
        setSelectedRegion((curr) => {
          if (!curr) return null;
          // Check if curr is in new view
          const available = getRegionsByViewAndMode(newView, curr.type);
          const stillValid = available.some((r) => r.id === curr.id);
          return stillValid ? curr : null;
        });
        setHoveredRegion(null);
      }
      return newView;
    });
  }, []);

  const selectRegion = useCallback((region: AnatomyRegionDefinition) => {
    setSelectedRegion((curr) => (curr?.id === region.id ? null : region));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRegion(null);
    setHoveredRegion(null);
  }, []);

  // Compute related regions for subtle secondary highlight
  const relatedRegionIds = useMemo(() => {
    if (!selectedRegion) return [];
    return findRelatedRegions(selectedRegion.id).map((r) => r.id);
  }, [selectedRegion]);

  return {
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
  };
}
