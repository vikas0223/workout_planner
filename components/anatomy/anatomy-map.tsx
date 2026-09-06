/**
 * Anatomy Map Canvas Component
 * 
 * Integrated anatomy visualization widget containing view controls,
 * SVG silhouette, joint nodes, and dynamic hover tooltip.
 */

'use client';

import React, { useMemo } from 'react';
import { BodySex, BodyView, AnatomyMode, AnatomyRegionDefinition } from '@/types/domain';
import { BodySilhouette } from './body-silhouette';
import { AnatomyControls } from './anatomy-controls';
import { AnatomyTooltip } from './anatomy-tooltip';
import { getRegionExerciseCount } from '@/lib/anatomy/anatomy-definitions';

export interface AnatomyMapProps {
  mode: AnatomyMode;
  sex: BodySex;
  view: BodyView;
  selectedRegion: AnatomyRegionDefinition | null;
  hoveredRegion: AnatomyRegionDefinition | null;
  relatedRegionIds?: string[];
  heatmap?: Record<string, number>;
  onModeChange: (mode: AnatomyMode) => void;
  onSexChange: (sex: BodySex) => void;
  onViewChange: (view: BodyView) => void;
  onSelectRegion: (region: AnatomyRegionDefinition) => void;
  onHoverRegion: (region: AnatomyRegionDefinition | null) => void;
  onClearSelection: () => void;
}

export function AnatomyMap({
  mode,
  sex,
  view,
  selectedRegion,
  hoveredRegion,
  relatedRegionIds,
  heatmap,
  onModeChange,
  onSexChange,
  onViewChange,
  onSelectRegion,
  onHoverRegion,
  onClearSelection,
}: AnatomyMapProps) {
  const activeHoverOrSelect = hoveredRegion || selectedRegion;

  // Cached, zero-cost count retrieval for hover performance
  const activeExerciseCount = useMemo(() => {
    return activeHoverOrSelect ? getRegionExerciseCount(activeHoverOrSelect) : undefined;
  }, [activeHoverOrSelect]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Header */}
      <AnatomyControls
        mode={mode}
        sex={sex}
        view={view}
        hasSelection={selectedRegion !== null}
        onModeChange={onModeChange}
        onSexChange={onSexChange}
        onViewChange={onViewChange}
        onClearSelection={onClearSelection}
      />

      {/* Main Canvas Card */}
      <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-white to-slate-50/80 rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Silhouette Vector Body */}
        <div className="w-full max-w-[280px] sm:max-w-[320px] py-2">
          <BodySilhouette
            sex={sex}
            view={view}
            mode={mode}
            selectedRegion={selectedRegion}
            hoveredRegion={hoveredRegion}
            relatedRegionIds={relatedRegionIds}
            heatmap={heatmap}
            onSelectRegion={onSelectRegion}
            onHoverRegion={onHoverRegion}
          />
        </div>

        {/* Live Tooltip / Status Display */}
        <div className="w-full max-w-sm mt-3">
          <AnatomyTooltip region={activeHoverOrSelect} exerciseCount={activeExerciseCount} />
        </div>
      </div>
    </div>
  );
}
