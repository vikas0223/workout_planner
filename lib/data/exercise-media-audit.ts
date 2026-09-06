/**
 * Exercise Media Coverage Audit & Asset Status Report (Section V & W)
 *
 * Tracks:
 * - Replyf exercise ID
 * - Exercise name
 * - Matched external ID (exercises-dataset)
 * - Media status: 'READY' | 'STATIC' | 'ANIMATED' | 'UNAVAILABLE' | 'FALLBACK'
 * - Media type: 'animation' | 'video' | 'svg' | 'image' | 'none'
 * - Source & license & attribution
 * - Commercial-use permission status
 * - Fallback required flag
 */

import fs from 'fs';
import path from 'path';
import { Exercise } from '@/types/domain';
import { CANONICAL_EXERCISES } from './canonical-exercises';
import { getExerciseMapping } from './exercise-dataset-mapping';

export type MediaCoverageStatus = 'READY' | 'STATIC' | 'ANIMATED' | 'UNAVAILABLE' | 'FALLBACK';

export interface ExerciseMediaAuditRecord {
  exerciseId: string;
  exerciseName: string;
  matchedExternalId: string | null;
  status: MediaCoverageStatus;
  mediaType: 'animation' | 'video' | 'svg' | 'image' | 'none';
  mediaPath: string | null;
  source: string;
  license: string;
  attribution: string;
  commercialUseAllowed: boolean;
  fallbackRequired: boolean;
  fallbackAllowed: boolean;
}

export interface MediaAuditSummary {
  totalExercises: number;
  exercisesWithMedia: number;
  exercisesWithFallbackAllowed: number;
  statusBreakdown: Record<MediaCoverageStatus, number>;
  mediaTypeBreakdown: Record<string, number>;
  verifiedCoreExercises: {
    name: string;
    verified: boolean;
    mediaPath: string | null;
    status: MediaCoverageStatus;
  }[];
}

/**
 * 16 High-Priority exercises specified in Section W
 */
export const HIGH_PRIORITY_EXERCISES = [
  'Abductor Machine',
  'Adductor Machine',
  'Ankle Rotations',
  'Barbell Back Squat',
  'Barbell Bench Press',
  'Deadlift',
  'Pull-Up',
  'Overhead Press',
  'Barbell Row',
  'Dips',
  'Lunges',
  'Push-Ups',
  'Lat Pulldown',
  'Dumbbell Press',
  'Biceps Curl',
  'Triceps Extension',
];

// Backward-compatible alias
export const MINIMUM_VERIFIED_EXERCISES = HIGH_PRIORITY_EXERCISES;

/**
 * Checks whether an asset file exists locally in public/ directory
 */
function fileExistsInPublic(urlPath: string): boolean {
  if (!urlPath || !urlPath.startsWith('/')) return false;
  try {
    const publicPath = path.resolve(process.cwd(), 'public', urlPath.replace(/^\//, ''));
    return fs.existsSync(publicPath);
  } catch {
    return false;
  }
}

/**
 * Derives comprehensive audit records across canonical exercises
 */
export function auditExerciseMediaCoverage(exercises: Exercise[] = CANONICAL_EXERCISES): ExerciseMediaAuditRecord[] {
  return exercises.map((ex) => {
    const primaryMedia = ex.media && ex.media.length > 0 ? ex.media[0] : null;
    let mediaType: 'animation' | 'video' | 'svg' | 'image' | 'none' = 'none';
    let mediaPath: string | null = null;
    let source = ex.provenance?.source || 'in_house';
    let license = ex.provenance?.license || 'CC-BY-4.0';
    let attribution = ex.provenance?.attribution || 'Workout Planner Platform';
    let commercialUseAllowed = ex.provenance?.commercialUseAllowed ?? true;

    if (primaryMedia) {
      mediaPath = primaryMedia.url;
      if (primaryMedia.type === 'animation' || primaryMedia.type === 'gif') {
        mediaType = 'animation';
      } else if (primaryMedia.type === 'video') {
        mediaType = 'video';
      } else if (primaryMedia.type === 'svg' || primaryMedia.url.endsWith('.svg')) {
        mediaType = 'svg';
      } else {
        mediaType = 'image';
      }

      if (primaryMedia.provenance) {
        source = primaryMedia.provenance.source ?? source;
        license = primaryMedia.provenance.license ?? license;
        attribution = primaryMedia.provenance.attribution || attribution;
        commercialUseAllowed = typeof primaryMedia.provenance.commercialUseAllowed === 'boolean'
          ? primaryMedia.provenance.commercialUseAllowed
          : commercialUseAllowed;
      }
    } else if (ex.thumbnailUrl || ex.mediaUrl) {
      mediaPath = ex.thumbnailUrl || ex.mediaUrl || null;
      mediaType = mediaPath?.endsWith('.svg') ? 'svg' : 'image';
    }

    const mapping = getExerciseMapping(ex.id);
    const matchedExternalId = mapping ? mapping.externalSourceId : null;

    // Check physical presence or reachability
    const isPhysicalAsset = mediaPath ? fileExistsInPublic(mediaPath) : false;

    let status: MediaCoverageStatus = 'FALLBACK';
    let fallbackRequired = true;

    if (isPhysicalAsset) {
      fallbackRequired = false;
      if (mediaType === 'animation' || mediaType === 'video') {
        status = 'ANIMATED';
      } else if (mediaType === 'svg' || mediaType === 'image') {
        status = 'STATIC';
      } else {
        status = 'READY';
      }
    } else if (mediaPath) {
      // Declared media reference without local file -> fallback required
      status = 'UNAVAILABLE';
      fallbackRequired = true;
    } else {
      status = 'FALLBACK';
      fallbackRequired = true;
    }

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      matchedExternalId,
      status,
      mediaType,
      mediaPath,
      source,
      license,
      attribution,
      commercialUseAllowed,
      fallbackRequired,
      fallbackAllowed: true, // Offline/graceful fallback is always guaranteed
    };
  });
}

/**
 * Returns a high-level summary of the media audit
 */
export function getMediaAuditSummary(exercises: Exercise[] = CANONICAL_EXERCISES): MediaAuditSummary {
  const audit = auditExerciseMediaCoverage(exercises);
  const mediaTypeBreakdown: Record<string, number> = {
    animation: 0,
    video: 0,
    svg: 0,
    image: 0,
    none: 0,
  };

  const statusBreakdown: Record<MediaCoverageStatus, number> = {
    READY: 0,
    STATIC: 0,
    ANIMATED: 0,
    UNAVAILABLE: 0,
    FALLBACK: 0,
  };

  for (const record of audit) {
    mediaTypeBreakdown[record.mediaType] = (mediaTypeBreakdown[record.mediaType] || 0) + 1;
    statusBreakdown[record.status] = (statusBreakdown[record.status] || 0) + 1;
  }

  const verifiedCoreExercises = HIGH_PRIORITY_EXERCISES.map((reqName) => {
    const normalizedReq = reqName.toLowerCase().replace(/[-_\s]/g, '');
    const found = audit.find((rec) => {
      const normName = rec.exerciseName.toLowerCase().replace(/[-_\s]/g, '');
      if (normName === normalizedReq) return true;
      if (normalizedReq === 'barbellbacksquat' && (normName === 'barbellsquat' || normName === 'backsquat')) return true;
      if (normalizedReq === 'barbellbenchpress' && normName === 'benchpress') return true;
      if (normalizedReq === 'pullup' && (normName === 'pullups' || normName === 'pullup')) return true;
      if ((normalizedReq === 'pushups' || normalizedReq === 'pushup') && (normName === 'pushupvariations' || normName === 'pushups' || normName === 'pushup')) return true;
      if (normalizedReq === 'barbellrow' && (normName === 'barbellrows' || normName === 'barbellrow')) return true;
      if (normalizedReq === 'dumbbellpress' && (normName.includes('dumbbellpress') && !normName.includes('band'))) return true;
      if (normalizedReq === 'bicepscurl' && (normName === 'bicepcurls' || normName === 'bicepcurl')) return true;
      if (normalizedReq === 'tricepsextension' && (normName === 'tricepextensions' || normName === 'tricepextension')) return true;
      return false;
    });

    const isVerified = !!found && (found.status === 'STATIC' || found.status === 'ANIMATED' || found.status === 'READY');

    return {
      name: reqName,
      verified: isVerified,
      mediaPath: found ? found.mediaPath : null,
      status: found ? found.status : 'FALLBACK',
    };
  });

  return {
    totalExercises: exercises.length,
    exercisesWithMedia: audit.filter((r) => r.mediaType !== 'none').length,
    exercisesWithFallbackAllowed: audit.filter((r) => r.fallbackAllowed).length,
    statusBreakdown,
    mediaTypeBreakdown,
    verifiedCoreExercises,
  };
}

export const CANONICAL_MEDIA_AUDIT = auditExerciseMediaCoverage();
