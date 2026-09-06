/**
 * Deterministic Exercise Dataset Mapping & Provenance Registry
 *
 * External Sources:
 * 1. free-exercise-db (yuhonas): Public Domain / The Unlicense
 *    Pinned Commit: a859101d633a01c4a1a920d6a8ce41dabba0705f
 * 2. azilRababe/Exercises_Dataset: MIT repository, candidate GIFs (referenceOnly = true)
 *    Pinned Commit: 29145279a39a2675f5e4ade584a50718f71cfa58
 * 3. ExerciseDB API: Free version / supplemental metadata (referenceOnly = true)
 *    Pinned Commit: 401ef93437a160f86927fee43b8e692532d04469
 *
 * CRITICAL LICENSE SEPARATION & CANONICAL RULE:
 * - Replyf's 166 canonical exercises remain authoritative.
 * - free-exercise-db media is released into public domain under The Unlicense and is bundled locally.
 * - azilRababe media is third-party scraped without explicit media-level rights -> referenceOnly: true.
 * - ExerciseDB media is subject to hosted non-commercial terms -> referenceOnly: true.
 * - In-house vector illustrations are project-owned under CC-BY-4.0.
 */

import { Exercise, MediaVerificationStatus } from '@/types/domain';

export type MappingMatchKey =
  | 'exact_source_id'
  | 'exact_normalized_name'
  | 'verified_name_equipment'
  | 'verified_name_muscles'
  | 'manual_verified'
  | 'normalized_name'
  | 'equipment_target_family';

export interface ExternalExerciseRecord {
  id: string; // Source ID in external dataset
  name: string;
  force?: 'pull' | 'push' | 'static' | null;
  level?: 'beginner' | 'intermediate' | 'expert' | string;
  mechanic?: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
}

export interface ExerciseMappingRecord {
  canonicalExerciseId: string;
  canonicalExerciseName: string;
  externalSource: 'free-exercise-db' | 'azilRababe' | 'ExerciseDB' | 'exercises-dataset';
  externalSourceId: string;
  externalExerciseName: string;
  matchedKey: MappingMatchKey;
  sourceCommit?: string;
  sourcePath?: string;
  assetHash?: string;
  verification?: MediaVerificationStatus;
  metadataLicense: 'Unlicense' | 'MIT' | 'Proprietary';
  mediaRightsOwner: string;
  mediaLicensedToReplyf: boolean;
  mediaAttributionRequired: string;
  commercialUseAllowed: boolean;
  redistributionAllowed?: boolean;
  localBundleAllowed?: boolean;
  referenceOnly?: boolean;
  matchConfidence?: number;
}

/**
 * Normalizes exercise names deterministically for canonical ↔ external matching.
 * Strips punctuation, pluralizations, equipment prefixes, and whitespace.
 */
export function normalizeExerciseName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[—–\-_\/\\(),.:;']/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(barbell|dumbbell|cable|machine|smith|band|resistance band|kettlebell)\b/g, '')
    .replace(/s\b/g, '') // remove trailing plural s
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Deterministic mapping table between Replyf canonical exercise IDs and external sources
 */
export const CANONICAL_TO_EXTERNAL_DATASET_MAP: Record<string, ExerciseMappingRecord> = {
  // 1. Barbell Back Squat
  '00000000-0000-4000-8000-000000e08b53': {
    canonicalExerciseId: '00000000-0000-4000-8000-000000e08b53',
    canonicalExerciseName: 'Barbell Squat',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Barbell_Squat',
    externalExerciseName: 'Barbell Squat',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Barbell_Squat/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 2. Bench Press
  '00000000-0000-4000-8000-000012b3e666': {
    canonicalExerciseId: '00000000-0000-4000-8000-000012b3e666',
    canonicalExerciseName: 'Bench Press',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Barbell_Bench_Press_-_Medium_Grip',
    externalExerciseName: 'Barbell Bench Press - Medium Grip',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 3. Deadlift
  '00000000-0000-4000-8000-00001e04d96f': {
    canonicalExerciseId: '00000000-0000-4000-8000-00001e04d96f',
    canonicalExerciseName: 'Deadlift',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Barbell_Deadlift',
    externalExerciseName: 'Barbell Deadlift',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Barbell_Deadlift/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 4. Pull-Ups
  '00000000-0000-4000-8000-00005e103db0': {
    canonicalExerciseId: '00000000-0000-4000-8000-00005e103db0',
    canonicalExerciseName: 'Pull-ups',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Pullups',
    externalExerciseName: 'Pullups',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Pullups/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 5. Overhead Press
  '00000000-0000-4000-8000-00004cbde1ea': {
    canonicalExerciseId: '00000000-0000-4000-8000-00004cbde1ea',
    canonicalExerciseName: 'Overhead Press',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Standing_Military_Press',
    externalExerciseName: 'Standing Military Press',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Standing_Military_Press/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 6. Barbell Rows
  '00000000-0000-4000-8000-0000107d5e50': {
    canonicalExerciseId: '00000000-0000-4000-8000-0000107d5e50',
    canonicalExerciseName: 'Barbell Rows',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Bent_Over_Barbell_Row',
    externalExerciseName: 'Bent Over Barbell Row',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Bent_Over_Barbell_Row/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 7. Dips
  '00000000-0000-4000-8000-0000002f0d48': {
    canonicalExerciseId: '00000000-0000-4000-8000-0000002f0d48',
    canonicalExerciseName: 'Dips',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Dips_-_Chest_Version',
    externalExerciseName: 'Dips - Chest Version',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Dips_-_Chest_Version/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 8. Lunges
  '00000000-0000-4000-8000-000041104ed0': {
    canonicalExerciseId: '00000000-0000-4000-8000-000041104ed0',
    canonicalExerciseName: 'Lunges',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Barbell_Lunge',
    externalExerciseName: 'Barbell Lunge',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Barbell_Lunge/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 9. Push-Ups
  '00000000-0000-4000-8000-0000098d19f7': {
    canonicalExerciseId: '00000000-0000-4000-8000-0000098d19f7',
    canonicalExerciseName: 'Resistance Band Push-ups',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Pushups',
    externalExerciseName: 'Pushups',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Pushups/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 10. Lat Pulldown
  '00000000-0000-4000-8000-000036ee932b': {
    canonicalExerciseId: '00000000-0000-4000-8000-000036ee932b',
    canonicalExerciseName: 'Lat Pulldown',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Wide-Grip_Lat_Pulldown',
    externalExerciseName: 'Wide-Grip Lat Pulldown',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Wide-Grip_Lat_Pulldown/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 11. Bicep Curls
  '00000000-0000-4000-8000-000004d88adf': {
    canonicalExerciseId: '00000000-0000-4000-8000-000004d88adf',
    canonicalExerciseName: 'Bicep Curls',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Dumbbell_Bicep_Curl',
    externalExerciseName: 'Dumbbell Bicep Curl',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Dumbbell_Bicep_Curl/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 12. Incline Dumbbell Press
  '00000000-0000-4000-8000-000001e92846': {
    canonicalExerciseId: '00000000-0000-4000-8000-000001e92846',
    canonicalExerciseName: 'Incline Dumbbell Press',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Incline_Dumbbell_Press',
    externalExerciseName: 'Incline Dumbbell Press',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Incline_Dumbbell_Press/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 13. Band Pull-Aparts
  '00000000-0000-4000-8000-000020a82f50': {
    canonicalExerciseId: '00000000-0000-4000-8000-000020a82f50',
    canonicalExerciseName: 'Resistance Band Pull-Apart',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Band_Pull_Apart',
    externalExerciseName: 'Band Pull Apart',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Band_Pull_Apart/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 14. Triceps Extension
  '00000000-0000-4000-8000-0000538e9fda': {
    canonicalExerciseId: '00000000-0000-4000-8000-0000538e9fda',
    canonicalExerciseName: 'Resistance Band Tricep Extensions',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Band_Skull_Crusher',
    externalExerciseName: 'Band Skull Crusher',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Band_Skull_Crusher/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 15. Leg Press
  '00000000-0000-4000-8000-0000248117c4': {
    canonicalExerciseId: '00000000-0000-4000-8000-0000248117c4',
    canonicalExerciseName: 'Leg Press',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Leg_Press',
    externalExerciseName: 'Leg Press',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Leg_Press/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 16. Romanian Deadlift
  '00000000-0000-4000-8000-00003a39fa7d': {
    canonicalExerciseId: '00000000-0000-4000-8000-00003a39fa7d',
    canonicalExerciseName: 'Romanian Deadlift',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Romanian_Deadlift',
    externalExerciseName: 'Romanian Deadlift',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Romanian_Deadlift/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 17. Leg Extensions
  '00000000-0000-4000-8000-00003c160133': {
    canonicalExerciseId: '00000000-0000-4000-8000-00003c160133',
    canonicalExerciseName: 'Leg Extensions',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Leg_Extensions',
    externalExerciseName: 'Leg Extensions',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Leg_Extensions/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 18. Glute-Ham Raises
  '00000000-0000-4000-8000-00002a24687d': {
    canonicalExerciseId: '00000000-0000-4000-8000-00002a24687d',
    canonicalExerciseName: 'Glute-Ham Raises',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Glute_Ham_Raise',
    externalExerciseName: 'Glute Ham Raise',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Glute_Ham_Raise/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 19. Hammer Curls
  '00000000-0000-4000-8000-000073f37e00': {
    canonicalExerciseId: '00000000-0000-4000-8000-000073f37e00',
    canonicalExerciseName: 'Hammer Curls',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Hammer_Curls',
    externalExerciseName: 'Hammer Curls',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Hammer_Curls/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 20. Mountain Climbers
  '00000000-0000-4000-8000-00006d36be2f': {
    canonicalExerciseId: '00000000-0000-4000-8000-00006d36be2f',
    canonicalExerciseName: 'Mountain Climbers',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Mountain_Climbers',
    externalExerciseName: 'Mountain Climbers',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Mountain_Climbers/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 21. Sled Push
  '00000000-0000-4000-8000-0000188686d1': {
    canonicalExerciseId: '00000000-0000-4000-8000-0000188686d1',
    canonicalExerciseName: 'Sled Push',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Sled_Push',
    externalExerciseName: 'Sled Push',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Sled_Push/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 22. Shoulder Stretch
  '00000000-0000-4000-8000-000068daabd8': {
    canonicalExerciseId: '00000000-0000-4000-8000-000068daabd8',
    canonicalExerciseName: 'Shoulder Stretch',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Shoulder_Stretch',
    externalExerciseName: 'Shoulder Stretch',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Shoulder_Stretch/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 23. Child's Pose
  '00000000-0000-4000-8000-0000230c3884': {
    canonicalExerciseId: '00000000-0000-4000-8000-0000230c3884',
    canonicalExerciseName: "Child's Pose",
    externalSource: 'free-exercise-db',
    externalSourceId: 'Childs_Pose',
    externalExerciseName: "Child's Pose",
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Childs_Pose/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 24. World's Greatest Stretch
  '00000000-0000-4000-8000-00001f71faba': {
    canonicalExerciseId: '00000000-0000-4000-8000-00001f71faba',
    canonicalExerciseName: "World's Greatest Stretch",
    externalSource: 'free-exercise-db',
    externalSourceId: 'Worlds_Greatest_Stretch',
    externalExerciseName: "World's Greatest Stretch",
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Worlds_Greatest_Stretch/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 25. Dumbbell Shoulder Press
  '00000000-0000-4000-8000-00005ac5d43a': {
    canonicalExerciseId: '00000000-0000-4000-8000-00005ac5d43a',
    canonicalExerciseName: 'Dumbbell Shoulder Press',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Dumbbell_Shoulder_Press',
    externalExerciseName: 'Dumbbell Shoulder Press',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Dumbbell_Shoulder_Press/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 26. Seated Cable Rows
  '00000000-0000-4000-8000-000051798d72': {
    canonicalExerciseId: '00000000-0000-4000-8000-000051798d72',
    canonicalExerciseName: 'Seated Cable Rows',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Seated_Cable_Rows',
    externalExerciseName: 'Seated Cable Rows',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Seated_Cable_Rows/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 27. Face Pulls
  '00000000-0000-4000-8000-00001eb9f4a2': {
    canonicalExerciseId: '00000000-0000-4000-8000-00001eb9f4a2',
    canonicalExerciseName: 'Face Pulls',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Face_Pull',
    externalExerciseName: 'Face Pull',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Face_Pull/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 28. Plank
  '00000000-0000-4000-8000-0000065cda62': {
    canonicalExerciseId: '00000000-0000-4000-8000-0000065cda62',
    canonicalExerciseName: 'Plank',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Plank',
    externalExerciseName: 'Plank',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Plank/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 29. Tricep Pushdowns
  '00000000-0000-4000-8000-00000af286ad': {
    canonicalExerciseId: '00000000-0000-4000-8000-00000af286ad',
    canonicalExerciseName: 'Tricep Pushdowns',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Triceps_Pushdown',
    externalExerciseName: 'Triceps Pushdown',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Triceps_Pushdown/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 30. Calf Raises
  '00000000-0000-4000-8000-00002964f31c': {
    canonicalExerciseId: '00000000-0000-4000-8000-00002964f31c',
    canonicalExerciseName: 'Calf Raises',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Smith_Machine_Calf_Raise',
    externalExerciseName: 'Smith Machine Calf Raise',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Smith_Machine_Calf_Raise/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
  // 31. Leg Curls
  '00000000-0000-4000-8000-000023cb7348': {
    canonicalExerciseId: '00000000-0000-4000-8000-000023cb7348',
    canonicalExerciseName: 'Leg Curls',
    externalSource: 'free-exercise-db',
    externalSourceId: 'Lying_Leg_Curls',
    externalExerciseName: 'Lying Leg Curls',
    matchedKey: 'exact_source_id',
    sourceCommit: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
    sourcePath: 'exercises/Lying_Leg_Curls/0.jpg',
    verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
    metadataLicense: 'Unlicense',
    mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
    mediaLicensedToReplyf: true,
    mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
    commercialUseAllowed: true,
    redistributionAllowed: true,
    localBundleAllowed: true,
    referenceOnly: false,
    matchConfidence: 1.0,
  },
};

/**
 * Returns external dataset mapping for a given canonical exercise ID
 */
export function getExerciseMapping(canonicalExerciseId: string): ExerciseMappingRecord | null {
  return CANONICAL_TO_EXTERNAL_DATASET_MAP[canonicalExerciseId] || null;
}

/**
 * Matches an exercise against an external dataset record using deterministic keys and safety signatures.
 * HARD ACCEPTANCE CRITERIA:
 * Squat media must NEVER match Ankle Rotations, Abductor Machine, or Adductor Machine.
 */
export function matchExerciseDeterministically(
  exercise: Exercise,
  externalRecords: ExternalExerciseRecord[]
): { record: ExternalExerciseRecord; matchKey: MappingMatchKey } | null {
  // 1. Exact source ID if already stored in exercise provenance
  if (exercise.provenance?.sourceExerciseId) {
    const found = externalRecords.find((r) => r.id === exercise.provenance?.sourceExerciseId);
    if (found) return { record: found, matchKey: 'exact_source_id' };
  }

  const normTarget = normalizeExerciseName(exercise.name);

  // 2. Normalized name match
  for (const ext of externalRecords) {
    if (normalizeExerciseName(ext.name) === normTarget) {
      // Safety signature check
      const extEquip = (ext.equipment || '').toLowerCase();
      const exEquip = (exercise.equipment || []).map((e) => e.toLowerCase());
      const isEquipCompatible = exEquip.length === 0 || !extEquip || exEquip.some((e) => e.includes(extEquip) || extEquip.includes(e));
      
      const isSafetyViolated =
        (normTarget.includes('anklerotation') || normTarget.includes('abductor') || normTarget.includes('adductor')) &&
        normalizeExerciseName(ext.name).includes('squat');

      if (isEquipCompatible && !isSafetyViolated) {
        return { record: ext, matchKey: 'normalized_name' };
      }
    }
  }

  // 3. Equipment + Primary Target + Exercise Family match
  const primaryTarget = exercise.primaryMuscles[0]?.toLowerCase();
  const primaryEquip = exercise.equipment[0]?.toLowerCase();

  if (primaryTarget && primaryEquip) {
    for (const ext of externalRecords) {
      const extEquip = ext.equipment?.toLowerCase();
      const extMuscles = (ext.primaryMuscles || []).map((m) => m.toLowerCase());
      if (extEquip === primaryEquip && extMuscles.includes(primaryTarget)) {
        const extNorm = normalizeExerciseName(ext.name);
        if (normTarget.includes(extNorm) || extNorm.includes(normTarget)) {
          const isSafetyViolated =
            (normTarget.includes('anklerotation') || normTarget.includes('abductor') || normTarget.includes('adductor')) &&
            extNorm.includes('squat');

          if (!isSafetyViolated) {
            return { record: ext, matchKey: 'equipment_target_family' };
          }
        }
      }
    }
  }

  return null;
}
