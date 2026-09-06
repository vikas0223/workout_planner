/**
 * Semantic SVG Body Silhouette Component
 * 
 * Renders original, highly detailed vector human silhouettes for:
 * - Male Front & Back
 * - Female Front & Back
 * 
 * Supports Muscle Region interaction & Joint Node articulation overlay.
 */

'use client';

import React from 'react';
import { BodySex, BodyView, AnatomyMode, AnatomyRegionDefinition } from '@/types/domain';
import { JointNode } from './joint-node';
import { getRegionsByViewAndMode } from '@/lib/anatomy/anatomy-definitions';

import { getHeatmapFillColor, mapReplyfToMuscleMap } from '@/lib/anatomy/muscle-map-integration';

export interface BodySilhouetteProps {
  sex: BodySex;
  view: BodyView;
  mode: AnatomyMode;
  selectedRegion: AnatomyRegionDefinition | null;
  hoveredRegion: AnatomyRegionDefinition | null;
  relatedRegionIds?: string[];
  heatmap?: Record<string, number>;
  onSelectRegion: (region: AnatomyRegionDefinition) => void;
  onHoverRegion: (region: AnatomyRegionDefinition | null) => void;
}

export function BodySilhouette({
  sex,
  view,
  mode,
  selectedRegion,
  hoveredRegion,
  relatedRegionIds = [],
  heatmap,
  onSelectRegion,
  onHoverRegion,
}: BodySilhouetteProps) {
  const regions = getRegionsByViewAndMode(view, mode);

  const getRegionState = (regionId: string) => {
    const isSelected = selectedRegion?.id === regionId;
    const isHovered = hoveredRegion?.id === regionId;
    const isRelated = relatedRegionIds.includes(regionId);
    return { isSelected, isHovered, isRelated };
  };

  const getMuscleHeatmapIntensity = (regionId: string): number | undefined => {
    if (!heatmap) return undefined;
    if (heatmap[regionId] !== undefined) return heatmap[regionId];
    const geometryIds = mapReplyfToMuscleMap(regionId);
    for (const gid of geometryIds) {
      if (heatmap[gid] !== undefined) return heatmap[gid];
    }
    return undefined;
  };

  const getMusclePathClass = (regionId: string) => {
    const { isSelected, isHovered, isRelated } = getRegionState(regionId);
    if (isSelected) {
      return 'fill-indigo-600 stroke-indigo-900 stroke-2 filter drop-shadow-md cursor-pointer transition-all duration-200';
    }
    if (isHovered) {
      return 'fill-indigo-400 stroke-indigo-600 stroke-1.5 cursor-pointer transition-all duration-150';
    }
    if (isRelated) {
      return 'fill-indigo-200 stroke-indigo-300 stroke-1 cursor-pointer transition-all duration-200';
    }
    const intensity = getMuscleHeatmapIntensity(regionId);
    if (intensity !== undefined && intensity > 0) {
      return 'stroke-white stroke-1 hover:brightness-110 cursor-pointer transition-all duration-200';
    }
    return 'fill-slate-300 stroke-white stroke-1 hover:fill-indigo-300 cursor-pointer transition-all duration-200';
  };

  const renderMuscleRegion = (
    id: string,
    d: string,
    label: string
  ) => {
    const reg = regions.find((r) => r.id === id);
    if (!reg) return null;
    const { isSelected, isHovered, isRelated } = getRegionState(id);
    const intensity = getMuscleHeatmapIntensity(id);
    const customFill =
      !isSelected && !isHovered && !isRelated && intensity !== undefined && intensity > 0
        ? getHeatmapFillColor(intensity)
        : undefined;

    return (
      <path
        key={id}
        d={d}
        fill={customFill}
        data-region-id={id}
        data-region-type="muscle"
        role="button"
        tabIndex={0}
        aria-label={`${label} muscle`}
        aria-pressed={isSelected}
        className={`${getMusclePathClass(id)} outline-none focus:stroke-indigo-700 focus:stroke-2`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRegion(reg);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onSelectRegion(reg);
          }
        }}
        onMouseEnter={() => onHoverRegion(reg)}
        onMouseLeave={() => onHoverRegion(null)}
        onFocus={() => onHoverRegion(reg)}
        onBlur={() => onHoverRegion(null)}
      />
    );
  };

  // Coordinates for Joint Articulation Points (viewBox: 0 0 300 500)
  const getJointCoordinates = (): { joint: AnatomyRegionDefinition; cx: number; cy: number }[] => {
    const jointDefs = regions.filter((r) => r.type === 'joint');
    const coords: { joint: AnatomyRegionDefinition; cx: number; cy: number }[] = [];

    for (const j of jointDefs) {
      if (view === 'front') {
        if (j.id === 'spine_neck') coords.push({ joint: j, cx: 150, cy: 92 });
        else if (j.id === 'shoulder_left') coords.push({ joint: j, cx: 104, cy: 118 });
        else if (j.id === 'shoulder_right') coords.push({ joint: j, cx: 196, cy: 118 });
        else if (j.id === 'elbow_left') coords.push({ joint: j, cx: 84, cy: 184 });
        else if (j.id === 'elbow_right') coords.push({ joint: j, cx: 216, cy: 184 });
        else if (j.id === 'wrist_left') coords.push({ joint: j, cx: 68, cy: 250 });
        else if (j.id === 'wrist_right') coords.push({ joint: j, cx: 232, cy: 250 });
        else if (j.id === 'hip_left') coords.push({ joint: j, cx: 126, cy: 252 });
        else if (j.id === 'hip_right') coords.push({ joint: j, cx: 174, cy: 252 });
        else if (j.id === 'knee_left') coords.push({ joint: j, cx: 122, cy: 350 });
        else if (j.id === 'knee_right') coords.push({ joint: j, cx: 178, cy: 350 });
        else if (j.id === 'ankle_left') coords.push({ joint: j, cx: 116, cy: 450 });
        else if (j.id === 'ankle_right') coords.push({ joint: j, cx: 184, cy: 450 });
      } else {
        // Back View Joints
        if (j.id === 'spine_thoracic') coords.push({ joint: j, cx: 150, cy: 140 });
        else if (j.id === 'spine_lumbar') coords.push({ joint: j, cx: 150, cy: 215 });
        else if (j.id === 'shoulder_left_back') coords.push({ joint: j, cx: 106, cy: 122 });
        else if (j.id === 'shoulder_right_back') coords.push({ joint: j, cx: 194, cy: 122 });
        else if (j.id === 'elbow_left_back') coords.push({ joint: j, cx: 84, cy: 184 });
        else if (j.id === 'elbow_right_back') coords.push({ joint: j, cx: 216, cy: 184 });
        else if (j.id === 'knee_left_back') coords.push({ joint: j, cx: 122, cy: 350 });
        else if (j.id === 'knee_right_back') coords.push({ joint: j, cx: 178, cy: 350 });
        else if (j.id === 'ankle_left_back') coords.push({ joint: j, cx: 116, cy: 450 });
        else if (j.id === 'ankle_right_back') coords.push({ joint: j, cx: 184, cy: 450 });
      }
    }
    return coords;
  };

  const isFemale = sex === 'female';
  const isFront = view === 'front';

  return (
    <svg
      viewBox="0 0 300 500"
      className="w-full max-h-[500px] select-none transition-all duration-300"
      aria-label={`${sex} anatomical body map, ${view} view`}
    >
      <defs>
        <linearGradient id="bodyBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4338ca" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Base Silhouette Outline Background */}
      <g className="body-background-silhouette" opacity={mode === 'joint' ? 0.7 : 0.4}>
        {/* Head */}
        <circle cx="150" cy="46" r={isFemale ? 22 : 24} fill="url(#bodyBaseGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
        
        {/* Neck & Torso Background Shape */}
        <path
          d={
            isFront
              ? isFemale
                ? 'M 140 68 L 160 68 L 195 110 L 225 180 L 236 250 L 210 250 L 190 190 L 175 240 L 190 300 L 180 460 L 168 460 L 162 330 L 150 265 L 138 330 L 132 460 L 120 460 L 110 300 L 125 240 L 110 190 L 90 250 L 64 250 L 75 180 L 105 110 Z'
                : 'M 138 68 L 162 68 L 205 110 L 230 180 L 240 250 L 214 250 L 196 190 L 178 240 L 192 300 L 184 460 L 170 460 L 165 330 L 150 265 L 135 330 L 130 460 L 116 460 L 108 300 L 122 240 L 104 190 L 86 250 L 60 250 L 70 180 L 95 110 Z'
              : isFemale
                ? 'M 140 68 L 160 68 L 195 110 L 225 180 L 236 250 L 210 250 L 190 190 L 175 240 L 190 300 L 180 460 L 168 460 L 162 330 L 150 265 L 138 330 L 132 460 L 120 460 L 110 300 L 125 240 L 110 190 L 90 250 L 64 250 L 75 180 L 105 110 Z'
                : 'M 138 68 L 162 68 L 205 110 L 230 180 L 240 250 L 214 250 L 196 190 L 178 240 L 192 300 L 184 460 L 170 460 L 165 330 L 150 265 L 135 330 L 130 460 L 116 460 L 108 300 L 122 240 L 104 190 L 86 250 L 60 250 L 70 180 L 95 110 Z'
          }
          fill="url(#bodyBaseGrad)"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
      </g>

      {/* ========================================================
          FRONT VIEW MUSCLE REGIONS
          ======================================================== */}
      {mode === 'muscle' && isFront && (
        <g className="muscle-regions-front">
          {/* Chest (Left & Right Pectorals) */}
          {renderMuscleRegion(
            'chest',
            'M 148 114 C 135 114 116 118 114 135 C 112 152 130 156 148 154 Z M 152 114 C 165 114 184 118 186 135 C 188 152 170 156 152 154 Z',
            'Chest'
          )}

          {/* Front Deltoids (Left & Right Shoulders) */}
          {renderMuscleRegion(
            'front_deltoids',
            'M 112 112 C 102 114 94 125 96 142 C 104 144 112 135 114 124 Z M 188 112 C 198 114 206 125 204 142 C 196 144 188 135 186 124 Z',
            'Front Deltoids'
          )}

          {/* Biceps (Left & Right) */}
          {renderMuscleRegion(
            'biceps',
            'M 94 144 C 86 154 84 174 92 184 C 98 184 104 168 102 150 Z M 206 144 C 214 154 216 174 208 184 C 202 184 196 168 198 150 Z',
            'Biceps'
          )}

          {/* Forearms (Left & Right Anterior) */}
          {renderMuscleRegion(
            'forearms_front',
            'M 88 188 C 78 200 70 230 72 248 C 78 248 88 220 94 198 Z M 212 188 C 222 200 230 230 228 248 C 222 248 212 220 206 198 Z',
            'Forearms'
          )}

          {/* Abdominals (Core) */}
          {renderMuscleRegion(
            'abs',
            'M 136 158 L 164 158 L 164 176 L 136 176 Z M 136 180 L 164 180 L 164 198 L 136 198 Z M 136 202 L 164 202 L 164 228 L 136 228 Z',
            'Abdominals'
          )}

          {/* Obliques */}
          {renderMuscleRegion(
            'obliques',
            'M 132 162 C 124 170 122 200 128 228 C 132 228 134 200 134 162 Z M 168 162 C 176 170 178 200 172 228 C 168 228 166 200 166 162 Z',
            'Obliques'
          )}

          {/* Quadriceps */}
          {renderMuscleRegion(
            'quads',
            'M 124 246 C 114 260 112 300 118 340 C 130 340 144 310 146 254 Z M 176 246 C 186 260 188 300 182 340 C 170 340 156 310 154 254 Z',
            'Quadriceps'
          )}

          {/* Calves (Anterior / Tibialis) */}
          {renderMuscleRegion(
            'calves_front',
            'M 116 352 C 108 370 110 410 114 446 C 122 446 128 410 126 352 Z M 184 352 C 192 370 190 410 186 446 C 178 446 172 410 174 352 Z',
            'Calves'
          )}
        </g>
      )}

      {/* ========================================================
          BACK VIEW MUSCLE REGIONS
          ======================================================== */}
      {mode === 'muscle' && !isFront && (
        <g className="muscle-regions-back">
          {/* Trapezius / Upper Back */}
          {renderMuscleRegion(
            'traps',
            'M 150 72 L 138 95 L 118 116 L 150 148 L 182 116 L 162 95 Z',
            'Traps & Upper Back'
          )}

          {/* Rear Deltoids */}
          {renderMuscleRegion(
            'rear_deltoids',
            'M 114 116 C 102 120 96 130 98 144 C 106 142 114 135 116 124 Z M 186 116 C 198 120 204 130 202 144 C 194 142 186 135 184 124 Z',
            'Rear Deltoids'
          )}

          {/* Triceps */}
          {renderMuscleRegion(
            'triceps',
            'M 94 146 C 86 156 86 174 94 186 C 100 184 104 168 102 150 Z M 206 146 C 214 156 214 174 206 186 C 200 184 196 168 198 150 Z',
            'Triceps'
          )}

          {/* Forearms (Posterior) */}
          {renderMuscleRegion(
            'forearms_back',
            'M 90 190 C 80 202 72 230 74 248 C 80 248 90 220 96 198 Z M 210 190 C 220 202 228 230 226 248 C 220 248 210 220 204 198 Z',
            'Forearms'
          )}

          {/* Lats (Latissimus Dorsi) */}
          {renderMuscleRegion(
            'lats',
            'M 146 150 C 130 156 122 178 128 216 C 136 216 144 190 148 162 Z M 154 150 C 170 156 178 178 172 216 C 164 216 156 190 152 162 Z',
            'Lats'
          )}

          {/* Lower Back (Erectors) */}
          {renderMuscleRegion(
            'lower_back',
            'M 140 216 L 160 216 L 162 242 L 138 242 Z',
            'Lower Back'
          )}

          {/* Glutes */}
          {renderMuscleRegion(
            'glutes',
            'M 124 244 C 114 256 114 286 146 294 C 148 266 142 248 124 244 Z M 176 244 C 186 256 186 286 154 294 C 152 266 158 248 176 244 Z',
            'Glutes'
          )}

          {/* Hamstrings */}
          {renderMuscleRegion(
            'hamstrings',
            'M 120 298 C 114 316 114 340 122 352 C 132 352 144 330 146 298 Z M 180 298 C 186 316 186 340 178 352 C 168 352 156 330 154 298 Z',
            'Hamstrings'
          )}

          {/* Calves (Gastrocnemius & Soleus) */}
          {renderMuscleRegion(
            'calves_back',
            'M 116 356 C 106 374 108 410 114 446 C 124 446 130 410 126 356 Z M 184 356 C 194 374 192 410 186 446 C 176 446 170 410 174 356 Z',
            'Calves'
          )}
        </g>
      )}

      {/* ========================================================
          JOINT MODE ARTICULATION NODES
          ======================================================== */}
      {mode === 'joint' && (
        <g className="joint-articulation-nodes">
          {getJointCoordinates().map(({ joint, cx, cy }) => {
            const { isSelected, isHovered, isRelated } = getRegionState(joint.id);
            return (
              <JointNode
                key={joint.id}
                joint={joint}
                cx={cx}
                cy={cy}
                isSelected={isSelected}
                isHovered={isHovered}
                isRelated={isRelated}
                onSelect={onSelectRegion}
                onHover={onHoverRegion}
              />
            );
          })}
        </g>
      )}
    </svg>
  );
}
