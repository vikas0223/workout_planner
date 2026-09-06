/**
 * MuscleMap Integration & Presentation Geometry Layer
 *
 * Attribution:
 * Derived from / compatible with MuscleMap by Melih Colpan (MIT License)
 * Repository: https://github.com/melihcolpan/MuscleMap.git
 *
 * MIT License Notice:
 * Copyright (c) 2023 Melih Colpan
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software...
 *
 * Domain Authority:
 * Replyf's canonical anatomy definitions (lib/anatomy/anatomy-definitions.ts)
 * remain the sole application domain authority. This module maps canonical
 * Replyf muscles to presentation-layer geometry IDs for visualization,
 * interactive selection, and volume heatmaps.
 */

import { Exercise } from '@/types/domain';

export type MuscleMapSex = 'male' | 'female';
export type MuscleMapView = 'front' | 'back';
export type MuscleMapSide = 'left' | 'right' | 'center' | 'bilateral';

/**
 * MuscleMap standard presentation geometry identifiers
 */
export type MuscleMapGeometryId =
  | 'pectorals'
  | 'deltoids-anterior'
  | 'deltoids-lateral'
  | 'deltoids-posterior'
  | 'biceps'
  | 'triceps'
  | 'forearms-anterior'
  | 'forearms-posterior'
  | 'rectus-abdominis'
  | 'obliques'
  | 'quadriceps'
  | 'hamstrings'
  | 'gluteus-maximus'
  | 'gluteus-medius'
  | 'trapezius'
  | 'latissimus-dorsi'
  | 'erector-spinae'
  | 'calves-gastrocnemius'
  | 'calves-soleus'
  | 'tibialis-anterior'
  | 'adductors'
  | 'abductors';

export interface MuscleMapPresentationNode {
  geometryId: MuscleMapGeometryId;
  label: string;
  view: MuscleMapView;
  canonicalReplyfId: string;
  bilateralSides: ('left' | 'right')[];
  defaultSvgPathIds: string[];
}

/**
 * Explicit deterministic mapping from Replyf Canonical Muscle IDs to MuscleMap geometry IDs
 */
export const REPLYF_TO_MUSCLE_MAP: Record<string, MuscleMapGeometryId[]> = {
  chest: ['pectorals'],
  front_deltoids: ['deltoids-anterior', 'deltoids-lateral'],
  rear_deltoids: ['deltoids-posterior'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms_front: ['forearms-anterior'],
  forearms_back: ['forearms-posterior'],
  abs: ['rectus-abdominis'],
  obliques: ['obliques'],
  quads: ['quadriceps'],
  hamstrings: ['hamstrings'],
  glutes: ['gluteus-maximus', 'gluteus-medius'],
  traps: ['trapezius'],
  lats: ['latissimus-dorsi'],
  lower_back: ['erector-spinae'],
  calves_front: ['tibialis-anterior'],
  calves_back: ['calves-gastrocnemius', 'calves-soleus'],
  adductors: ['adductors'],
  abductors: ['abductors'],
};

/**
 * Inverse mapping from MuscleMap geometry ID back to Replyf canonical region ID
 */
export const MUSCLE_MAP_TO_REPLYF: Record<MuscleMapGeometryId, string> = {
  pectorals: 'chest',
  'deltoids-anterior': 'front_deltoids',
  'deltoids-lateral': 'front_deltoids',
  'deltoids-posterior': 'rear_deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  'forearms-anterior': 'forearms_front',
  'forearms-posterior': 'forearms_back',
  'rectus-abdominis': 'abs',
  obliques: 'obliques',
  quadriceps: 'quads',
  hamstrings: 'hamstrings',
  'gluteus-maximus': 'glutes',
  'gluteus-medius': 'glutes',
  trapezius: 'traps',
  'latissimus-dorsi': 'lats',
  'erector-spinae': 'lower_back',
  'calves-gastrocnemius': 'calves_back',
  'calves-soleus': 'calves_back',
  'tibialis-anterior': 'calves_front',
  adductors: 'quads',
  abductors: 'glutes',
};

/**
 * Maps a Replyf canonical muscle ID to MuscleMap presentation IDs
 */
export function mapReplyfToMuscleMap(canonicalMuscleId: string): MuscleMapGeometryId[] {
  const norm = canonicalMuscleId.toLowerCase().replace(/[\s-]/g, '_');
  return REPLYF_TO_MUSCLE_MAP[norm] || [];
}

/**
 * Maps a MuscleMap presentation ID back to Replyf's canonical domain ID
 */
export function mapMuscleMapToReplyf(geometryId: MuscleMapGeometryId): string | null {
  return MUSCLE_MAP_TO_REPLYF[geometryId] || null;
}

/**
 * Computes highlighting intensities (0.0 to 1.0) for MuscleMap presentation
 * based on an Exercise's canonical primaryMuscles and secondaryMuscles.
 *
 * Primary muscles receive 1.0 (maximal activation)
 * Secondary muscles receive 0.5 (synergist activation)
 */
export function getMuscleMapHighlightForExercise(
  exercise: Exercise
): Record<string, number> {
  const highlight: Record<string, number> = {};

  const nameToCanonicalId: Record<string, string> = {
    chest: 'chest',
    pectorals: 'chest',
    shoulders: 'front_deltoids',
    deltoids: 'front_deltoids',
    biceps: 'biceps',
    triceps: 'triceps',
    forearms: 'forearms_front',
    abs: 'abs',
    core: 'abs',
    obliques: 'obliques',
    quads: 'quads',
    quadriceps: 'quads',
    hamstrings: 'hamstrings',
    glutes: 'glutes',
    traps: 'traps',
    'upper back': 'traps',
    back: 'lats',
    lats: 'lats',
    'lower back': 'lower_back',
    calves: 'calves_back',
  };

  // Primary muscles: 1.0
  for (const p of exercise.primaryMuscles || []) {
    const canonical = nameToCanonicalId[p.toLowerCase()] || p.toLowerCase().replace(/[\s-]/g, '_');
    const geometryIds = mapReplyfToMuscleMap(canonical);
    for (const gid of geometryIds) {
      highlight[gid] = 1.0;
    }
    // Also record under canonical ID for direct Replyf consumers
    highlight[canonical] = 1.0;
  }

  // Secondary muscles: 0.5 (only if not already primary)
  for (const s of exercise.secondaryMuscles || []) {
    const canonical = nameToCanonicalId[s.toLowerCase()] || s.toLowerCase().replace(/[\s-]/g, '_');
    const geometryIds = mapReplyfToMuscleMap(canonical);
    for (const gid of geometryIds) {
      if (!highlight[gid]) {
        highlight[gid] = 0.5;
      }
    }
    if (!highlight[canonical]) {
      highlight[canonical] = 0.5;
    }
  }

  return highlight;
}

/**
 * Calculates CSS fill color corresponding to heatmap intensity [0.0, 1.0]
 */
export function getHeatmapFillColor(
  intensity: number | undefined,
  options?: {
    zeroColor?: string;
    lowColor?: string;
    mediumColor?: string;
    highColor?: string;
  }
): string {
  if (intensity === undefined || intensity <= 0) {
    return options?.zeroColor || '#cbd5e1'; // slate-300 default
  }

  if (intensity >= 0.8) {
    return options?.highColor || '#4f46e5'; // indigo-600
  }
  if (intensity >= 0.4) {
    return options?.mediumColor || '#818cf8'; // indigo-400
  }
  return options?.lowColor || '#c7d2fe'; // indigo-200
}

/**
 * Provenance notice for MuscleMap assets
 */
export const MUSCLE_MAP_PROVENANCE = {
  source: 'MuscleMap',
  author: 'Melih Colpan',
  license: 'MIT',
  url: 'https://github.com/melihcolpan/MuscleMap',
  commercialUseAllowed: true,
  domainAuthority: 'Replyf Domain Model (Internal)',
};
