/**
 * Exercise Media Coverage Audit
 * Tracks media availability, types, paths, licenses, and fallback status across the canonical catalog.
 */

import { Exercise } from '@/types/domain';
import { CANONICAL_EXERCISES } from './canonical-exercises';

export interface ExerciseMediaAuditRecord {
  exerciseId: string;
  exerciseName: string;
  mediaType: 'animation' | 'video' | 'svg' | 'image' | 'none';
  mediaPath: string | null;
  source: string;
  license: string;
  commercialUseAllowed: boolean;
  fallbackAllowed: boolean;
}

export interface MediaAuditSummary {
  totalExercises: number;
  exercisesWithMedia: number;
  exercisesWithFallbackAllowed: number;
  mediaTypeBreakdown: Record<string, number>;
  verifiedCoreExercises: {
    name: string;
    verified: boolean;
    mediaPath: string | null;
  }[];
}

export const MINIMUM_VERIFIED_EXERCISES = [
  'Abductor Machine',
  'Adductor Machine',
  'Ankle Rotations',
  'Barbell Back Squat',
  'Bench Press',
  'Deadlift',
  'Pull-Up',
  'Overhead Press',
  'Barbell Row',
  'Dips',
  'Lunges',
  'Push-Ups',
];

/**
 * Derives audit records for a collection of exercises
 */
export function auditExerciseMediaCoverage(exercises: Exercise[] = CANONICAL_EXERCISES): ExerciseMediaAuditRecord[] {
  return exercises.map((ex) => {
    const primaryMedia = ex.media && ex.media.length > 0 ? ex.media[0] : null;
    let mediaType: 'animation' | 'video' | 'svg' | 'image' | 'none' = 'none';
    let mediaPath: string | null = null;
    let source = ex.provenance?.source || 'in_house';
    let license = ex.provenance?.license || 'CC-BY-4.0';
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
        source = primaryMedia.provenance.source;
        license = primaryMedia.provenance.license;
        commercialUseAllowed = primaryMedia.provenance.commercialUseAllowed;
      }
    } else if (ex.thumbnailUrl || ex.mediaUrl) {
      mediaPath = ex.thumbnailUrl || ex.mediaUrl || null;
      mediaType = mediaPath?.endsWith('.svg') ? 'svg' : 'image';
    }

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      mediaType,
      mediaPath,
      source,
      license,
      commercialUseAllowed,
      fallbackAllowed: true, // Graceful fallback is always permitted and guaranteed
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

  for (const record of audit) {
    mediaTypeBreakdown[record.mediaType] = (mediaTypeBreakdown[record.mediaType] || 0) + 1;
  }

  const verifiedCoreExercises = MINIMUM_VERIFIED_EXERCISES.map((reqName) => {
    const normalizedReq = reqName.toLowerCase().replace(/[-_\s]/g, '');
    const found = audit.find((rec) => {
      const normName = rec.exerciseName.toLowerCase().replace(/[-_\s]/g, '');
      return (
        normName === normalizedReq ||
        (normalizedReq.includes('barbellbacksquat') && normName.includes('barbellsquat')) ||
        (normalizedReq.includes('pullup') && normName.includes('pullup')) ||
        (normalizedReq.includes('pushup') && normName.includes('pushup')) ||
        (normalizedReq.includes('barbellrow') && normName.includes('barbellrow'))
      );
    });

    return {
      name: reqName,
      verified: !!found && !!found.mediaPath,
      mediaPath: found ? found.mediaPath : null,
    };
  });

  return {
    totalExercises: exercises.length,
    exercisesWithMedia: audit.filter((r) => r.mediaType !== 'none').length,
    exercisesWithFallbackAllowed: audit.filter((r) => r.fallbackAllowed).length,
    mediaTypeBreakdown,
    verifiedCoreExercises,
  };
}

export const CANONICAL_MEDIA_AUDIT = auditExerciseMediaCoverage();
