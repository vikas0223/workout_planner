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

export type MediaCoverageStatus = 'ANIMATED' | 'STATIC' | 'FALLBACK' | 'REFERENCE_ONLY' | 'READY' | 'UNAVAILABLE' | 'UNVERIFIED';

export interface ExerciseMediaAuditRecord {
  // Section 35 fields
  replyfExerciseId: string;
  exerciseId: string; // Backward compatibility alias
  exerciseName: string;
  freeExerciseDbMatch: string | null;
  azilRababeMatch: string | null;
  exerciseDbMatch: string | null;
  matchedExternalId: string | null; // Backward compatibility alias

  approvedAnimatedMedia: string | null;
  approvedVideo: string | null;
  approvedSvg: string | null;
  approvedStaticImage: string | null;

  source: string;
  sourceExerciseId: string | null;
  sourceCommit: string | null;
  sourcePath: string | null;
  assetHash: string | null;

  license: string;
  commercialUseAllowed: boolean;
  redistributionAllowed: boolean;
  localBundleAllowed: boolean;

  identityVerification: 'verified' | 'unverified';
  rightsVerification: 'verified' | 'unverified' | 'restricted';
  assetVerification: 'verified' | 'broken';

  status: MediaCoverageStatus;
  mediaType: 'animation' | 'video' | 'svg' | 'image' | 'none';
  mediaPath: string | null;
  attribution: string;
  fallbackRequired: boolean;
  fallbackAllowed: boolean;
}

export interface MediaAuditSummary {
  totalExercises: number;
  exercisesWithMedia: number;
  exercisesWithFallbackAllowed: number;
  statusBreakdown: Record<string, number>;
  mediaTypeBreakdown: Record<string, number>;
  verifiedCoreExercises: {
    name: string;
    verified: boolean;
    mediaPath: string | null;
    status: MediaCoverageStatus;
  }[];
}

/**
 * 18 High-Priority exercises specified in Section 36
 */
export const HIGH_PRIORITY_EXERCISES = [
  'Abductor Machine',
  'Adductor Machine',
  'Ankle Rotations',
  'Assault Bike',
  'Band Pull-Aparts',
  'Barbell Rows',
  'Barbell Back Squat',
  'Bench Press',
  'Deadlift',
  'Pull-Ups',
  'Overhead Press',
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
 * Derives comprehensive audit records across canonical exercises according to Section 35
 */
export function auditExerciseMediaCoverage(exercises: Exercise[] = CANONICAL_EXERCISES): ExerciseMediaAuditRecord[] {
  return exercises.map((ex) => {
    const mapping = getExerciseMapping(ex.id);
    const mediaList = Array.isArray(ex.media) ? ex.media : [];

    let approvedAnimatedMedia: string | null = null;
    let approvedVideo: string | null = null;
    let approvedSvg: string | null = null;
    let approvedStaticImage: string | null = null;

    let mediaType: 'animation' | 'video' | 'svg' | 'image' | 'none' = 'none';
    let mediaPath: string | null = null;

    let source = ex.provenance?.source || 'in_house';
    let sourceExerciseId: string | null = ex.provenance?.sourceExerciseId || null;
    let sourceCommit: string | null = ex.provenance?.sourceCommit || null;
    let sourcePath: string | null = ex.provenance?.sourcePath || null;
    let assetHash: string | null = ex.provenance?.assetHash || null;
    let license = ex.provenance?.license || 'CC-BY-4.0';
    let attribution = ex.provenance?.attribution || 'Workout Planner Platform';
    let commercialUseAllowed = ex.provenance?.commercialUseAllowed ?? true;
    let redistributionAllowed = ex.provenance?.redistributionAllowed ?? true;
    let localBundleAllowed = ex.provenance?.localBundleAllowed ?? true;

    let identityVerification: 'verified' | 'unverified' = 'unverified';
    let rightsVerification: 'verified' | 'unverified' | 'restricted' = 'unverified';
    let assetVerification: 'verified' | 'broken' = 'broken';

    // Inspect attached media items
    for (const m of mediaList) {
      if (!m || !m.url) continue;
      const isPhys = fileExistsInPublic(m.url);
      const isRefOnly = m.provenance?.referenceOnly ?? false;
      const idVer = m.provenance?.verification?.identity ?? 'verified';
      const rVer = m.provenance?.verification?.rights ?? 'verified';
      const declaredAsset = m.provenance?.verification?.asset;
      const aVer = declaredAsset === 'broken' ? 'broken' : (isPhys ? (declaredAsset ?? 'verified') : 'broken');

      if (!isRefOnly && idVer === 'verified' && rVer === 'verified' && aVer === 'verified') {
        if (m.type === 'animation' || m.type === 'gif') {
          approvedAnimatedMedia = m.url;
        } else if (m.type === 'video') {
          approvedVideo = m.url;
        } else if (m.type === 'svg' || m.url.endsWith('.svg')) {
          approvedSvg = m.url;
        } else if (m.type === 'image') {
          approvedStaticImage = m.url;
        }
      }
    }

    // Determine primary presentation
    const primaryMedia = mediaList.length > 0 ? mediaList[0] : null;
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
        sourceExerciseId = primaryMedia.provenance.sourceExerciseId ?? sourceExerciseId;
        sourceCommit = primaryMedia.provenance.sourceCommit ?? sourceCommit;
        sourcePath = primaryMedia.provenance.sourcePath ?? sourcePath;
        assetHash = primaryMedia.provenance.assetHash ?? assetHash;
        license = primaryMedia.provenance.license ?? license;
        attribution = primaryMedia.provenance.attribution || attribution;
        commercialUseAllowed = primaryMedia.provenance.commercialUseAllowed ?? commercialUseAllowed;
        redistributionAllowed = primaryMedia.provenance.redistributionAllowed ?? redistributionAllowed;
        localBundleAllowed = primaryMedia.provenance.localBundleAllowed ?? localBundleAllowed;

        if (primaryMedia.provenance.verification) {
          identityVerification = primaryMedia.provenance.verification.identity;
          rightsVerification = primaryMedia.provenance.verification.rights;
          const declaredPrimaryAsset = primaryMedia.provenance.verification.asset;
          assetVerification = declaredPrimaryAsset === 'broken' ? 'broken' : (fileExistsInPublic(primaryMedia.url) ? (declaredPrimaryAsset ?? 'verified') : 'broken');
        }
      }
    } else if (ex.thumbnailUrl || ex.mediaUrl) {
      mediaPath = ex.thumbnailUrl || ex.mediaUrl || null;
      mediaType = mediaPath?.endsWith('.svg') ? 'svg' : 'image';
      if (mediaPath && fileExistsInPublic(mediaPath)) {
        assetVerification = 'verified';
        identityVerification = 'verified';
        rightsVerification = 'verified';
      }
    }

    // External matches
    const freeExerciseDbMatch = mapping?.externalSource === 'free-exercise-db' ? mapping.externalSourceId : null;
    const azilRababeMatch = mapping?.externalSource === 'azilRababe' ? mapping.externalSourceId : null;
    const exerciseDbMatch = mapping?.externalSource === 'ExerciseDB' ? mapping.externalSourceId : null;
    const matchedExternalId = mapping ? mapping.externalSourceId : null;

    // Check physical presence or reachability
    const isPhysicalAsset = mediaPath ? fileExistsInPublic(mediaPath) : false;

    let status: MediaCoverageStatus = 'FALLBACK';
    let fallbackRequired = true;

    const hasApprovedRightsAndIdentity =
      identityVerification === 'verified' &&
      rightsVerification === 'verified' &&
      assetVerification === 'verified';

    if (primaryMedia?.provenance?.referenceOnly) {
      status = 'REFERENCE_ONLY';
      fallbackRequired = true;
    } else if (isPhysicalAsset) {
      if (hasApprovedRightsAndIdentity) {
        fallbackRequired = false;
        if (mediaType === 'animation' || mediaType === 'video') {
          status = 'ANIMATED';
        } else {
          status = 'STATIC';
        }
      } else {
        status = 'UNVERIFIED';
        fallbackRequired = true;
      }
    } else if (mediaPath) {
      status = 'FALLBACK';
      fallbackRequired = true;
    } else {
      status = 'FALLBACK';
      fallbackRequired = true;
    }

    return {
      replyfExerciseId: ex.id,
      exerciseId: ex.id,
      exerciseName: ex.name,
      freeExerciseDbMatch,
      azilRababeMatch,
      exerciseDbMatch,
      matchedExternalId,

      approvedAnimatedMedia,
      approvedVideo,
      approvedSvg,
      approvedStaticImage,

      source,
      sourceExerciseId,
      sourceCommit,
      sourcePath,
      assetHash,

      license,
      commercialUseAllowed,
      redistributionAllowed,
      localBundleAllowed,

      identityVerification,
      rightsVerification,
      assetVerification,

      status,
      mediaType,
      mediaPath,
      attribution,
      fallbackRequired,
      fallbackAllowed: true,
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

  const statusBreakdown: Record<string, number> = {
    STATIC: 0,
    ANIMATED: 0,
    FALLBACK: 0,
    REFERENCE_ONLY: 0,
    READY: 0,
    UNAVAILABLE: 0,
    UNVERIFIED: 0,
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
      if (normalizedReq === 'benchpress' && (normName === 'benchpress' || normName === 'barbellbenchpress')) return true;
      if (normalizedReq === 'pullups' && (normName === 'pullups' || normName === 'pullup')) return true;
      if (normalizedReq === 'pushups' && (normName === 'pushupvariations' || normName === 'pushups' || normName === 'pushup')) return true;
      if (normalizedReq === 'barbellrows' && (normName === 'barbellrows' || normName === 'barbellrow')) return true;
      if (normalizedReq === 'dumbbellpress' && (normName.includes('dumbbellpress') && !normName.includes('band'))) return true;
      if (normalizedReq === 'bicepscurl' && (normName === 'bicepcurls' || normName === 'bicepcurl')) return true;
      if (normalizedReq === 'tricepsextension' && (normName === 'tricepextensions' || normName === 'tricepextension')) return true;
      if (normalizedReq === 'bandpullaparts' && (normName.includes('bandpullapart') || normName.includes('resistancebandpullapart'))) return true;
      if (normalizedReq === 'assaultbike' && normName.includes('assaultbike')) return true;
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
