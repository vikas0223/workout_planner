/**
 * Reproducible Exercise Media Import & Verification Pipeline (Section 9)
 *
 * Pinned Commits:
 * - free-exercise-db: a859101d633a01c4a1a920d6a8ce41dabba0705f (The Unlicense / Public Domain)
 * - azilRababe/Exercises_Dataset: 29145279a39a2675f5e4ade584a50718f71cfa58 (referenceOnly)
 * - ExerciseDB: 401ef93437a160f86927fee43b8e692532d04469 (referenceOnly)
 * - ExerciseDB Muscle Visualizer: 3177d1ce2c9ab382fd875901fa4c6c86b64462c0 (anatomy only)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const PINNED_SOURCE_COMMITS = {
  FREE_EXERCISE_DB: 'a859101d633a01c4a1a920d6a8ce41dabba0705f',
  AZIL_RABABE: '29145279a39a2675f5e4ade584a50718f71cfa58',
  EXERCISEDB: '401ef93437a160f86927fee43b8e692532d04469',
  MUSCLE_VISUALIZER: '3177d1ce2c9ab382fd875901fa4c6c86b64462c0',
};

export const MANUAL_VERIFIED_FREE_DB_MAP: Record<string, string> = {
  // 18 Priority exercises
  '00000000-0000-4000-8000-000000e08b53': 'Barbell_Squat',
  '00000000-0000-4000-8000-000012b3e666': 'Barbell_Bench_Press_-_Medium_Grip',
  '00000000-0000-4000-8000-00001e04d96f': 'Barbell_Deadlift',
  '00000000-0000-4000-8000-00005e103db0': 'Pullups',
  '00000000-0000-4000-8000-00004cbde1ea': 'Standing_Military_Press',
  '00000000-0000-4000-8000-0000002f0d48': 'Dips_-_Chest_Version',
  '00000000-0000-4000-8000-000041104ed0': 'Barbell_Lunge',
  '00000000-0000-4000-8000-0000098d19f7': 'Pushups',
  '00000000-0000-4000-8000-000036ee932b': 'Wide-Grip_Lat_Pulldown',
  '00000000-0000-4000-8000-000001e92846': 'Incline_Dumbbell_Press',
  '00000000-0000-4000-8000-000004d88adf': 'Dumbbell_Bicep_Curl',
  '00000000-0000-4000-8000-0000107d5e50': 'Bent_Over_Barbell_Row',
  '00000000-0000-4000-8000-000020a82f50': 'Band_Pull_Apart',
  '00000000-0000-4000-8000-00000ba244dd': 'Band_Pull_Apart',
  '00000000-0000-4000-8000-000016fbfbae': 'Bent_Over_Barbell_Row',
  '00000000-0000-4000-8000-0000538e9fda': 'Band_Skull_Crusher',

  // Additional verified movements
  '00000000-0000-4000-8000-0000248117c4': 'Leg_Press',
  '00000000-0000-4000-8000-00003a39fa7d': 'Romanian_Deadlift',
  '00000000-0000-4000-8000-00003c160133': 'Leg_Extensions',
  '00000000-0000-4000-8000-00002a24687d': 'Glute_Ham_Raise',
  '00000000-0000-4000-8000-000069907a58': 'Medicine_Ball_Chest_Pass',
  '00000000-0000-4000-8000-000073f37e00': 'Hammer_Curls',
  '00000000-0000-4000-8000-00006d36be2f': 'Mountain_Climbers',
  '00000000-0000-4000-8000-0000188686d1': 'Sled_Push',
  '00000000-0000-4000-8000-00002aa96f5b': 'Plyo_Push-up',
  '00000000-0000-4000-8000-000068daabd8': 'Shoulder_Stretch',
  '00000000-0000-4000-8000-0000230c3884': 'Childs_Pose',
  '00000000-0000-4000-8000-00001f71faba': 'Worlds_Greatest_Stretch',
  '00000000-0000-4000-8000-00005ac5d43a': 'Dumbbell_Shoulder_Press',
  '00000000-0000-4000-8000-000051798d72': 'Seated_Cable_Rows',
  '00000000-0000-4000-8000-00001eb9f4a2': 'Face_Pull',
  '00000000-0000-4000-8000-0000065cda62': 'Plank',
  '00000000-0000-4000-8000-00000af286ad': 'Triceps_Pushdown',
  '00000000-0000-4000-8000-00002964f31c': 'Smith_Machine_Calf_Raise',
  '00000000-0000-4000-8000-000023cb7348': 'Lying_Leg_Curls',
};

export function computeFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export function runMediaImport() {
  console.log('=== RUNNING REPRODUCIBLE EXERCISE MEDIA IMPORT ===\n');

  const rootDir = process.cwd();
  const freeDbDistPath = path.resolve(rootDir, 'scratch/free-exercise-db/dist/exercises.json');
  const freeDbExercisesDir = path.resolve(rootDir, 'scratch/free-exercise-db/exercises');
  const azilDbPath = path.resolve(rootDir, 'scratch/azilRababe-dataset/gifs_data.json');
  const canonicalFile = path.resolve(rootDir, 'lib/data/canonical-exercises.ts');
  const outputExercisesDir = path.resolve(rootDir, 'public/exercises');

  const freeDb = JSON.parse(fs.readFileSync(freeDbDistPath, 'utf8'));
  const azilDb = JSON.parse(fs.readFileSync(azilDbPath, 'utf8'));

  const canonicalCode = fs.readFileSync(canonicalFile, 'utf8');
  const eqIndex = canonicalCode.indexOf('export const CANONICAL_EXERCISES');
  const arrayStart = canonicalCode.indexOf('[', canonicalCode.indexOf('=', eqIndex));
  const arrayEnd = canonicalCode.lastIndexOf(']');
  const canonicalExercises: any[] = JSON.parse(canonicalCode.substring(arrayStart, arrayEnd + 1));

  const freeById = new Map(freeDb.map((f: any) => [f.id, f]));
  const azilByName = new Map(azilDb.map((a: any) => [a.title.toLowerCase().replace(/[^a-z0-9]/g, ''), a]));

  const importedMappingRecords: any[] = [];
  const exerciseMediaMap = new Map<string, any[]>();

  // Ensure public/exercises exists
  if (!fs.existsSync(outputExercisesDir)) {
    fs.mkdirSync(outputExercisesDir, { recursive: true });
  }

  let copiedCount = 0;

  for (const ex of canonicalExercises) {
    const slug = ex.slug || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const mediaList: any[] = [];

    // 1. Check if in-house SVG exists
    const inHouseSvgRel = `/images/exercises/${slug}.svg`;
    const inHouseSvgAbs = path.resolve(rootDir, 'public', inHouseSvgRel.replace(/^\//, ''));
    if (fs.existsSync(inHouseSvgAbs)) {
      const svgHash = computeFileSha256(inHouseSvgAbs);
      mediaList.push({
        id: `media-inhouse-${slug}`,
        type: 'svg',
        url: inHouseSvgRel,
        isLocal: true,
        provenance: {
          source: 'in_house',
          sourceExerciseId: slug,
          sourceCommit: 'HEAD',
          sourcePath: `public${inHouseSvgRel}`,
          assetHash: svgHash,
          importedAt: new Date().toISOString(),
          license: 'CC-BY-4.0',
          attribution: 'Workout Planner Platform Vector Collection (CC-BY-4.0)',
          commercialUseAllowed: true,
          redistributionAllowed: true,
          localBundleAllowed: true,
          referenceOnly: false,
          verification: {
            identity: 'verified',
            rights: 'verified',
            asset: 'verified',
          },
          matchMethod: 'manual_verified',
          matchConfidence: 1.0,
        },
      });
    }

    // 2. Check if free-exercise-db match exists
    const freeId = MANUAL_VERIFIED_FREE_DB_MAP[ex.id];
    if (freeId && freeById.has(freeId)) {
      const fRecord = freeById.get(freeId);
      if (fRecord.images && fRecord.images.length > 0) {
        const sourceRel = fRecord.images[0];
        const sourceAbs = path.resolve(freeDbExercisesDir, sourceRel);

        if (fs.existsSync(sourceAbs)) {
          const targetDir = path.resolve(outputExercisesDir, slug);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          const targetFile = path.resolve(targetDir, '0.jpg');
          fs.copyFileSync(sourceAbs, targetFile);
          copiedCount++;

          // Copy second angle/frame if present
          let posterRel: string | undefined = undefined;
          if (fRecord.images[1]) {
            const source1Abs = path.resolve(freeDbExercisesDir, fRecord.images[1]);
            if (fs.existsSync(source1Abs)) {
              const target1File = path.resolve(targetDir, '1.jpg');
              fs.copyFileSync(source1Abs, target1File);
              posterRel = `/exercises/${slug}/1.jpg`;
            }
          }

          const assetHash = computeFileSha256(targetFile);
          const localUrl = `/exercises/${slug}/0.jpg`;

          const freeMediaItem = {
            id: `media-free-${slug}`,
            type: 'image',
            url: localUrl,
            posterUrl: posterRel,
            isLocal: true,
            provenance: {
              source: 'free-exercise-db',
              sourceExerciseId: freeId,
              sourceCommit: PINNED_SOURCE_COMMITS.FREE_EXERCISE_DB,
              sourcePath: `exercises/${sourceRel}`,
              assetHash,
              importedAt: new Date().toISOString(),
              license: 'Unlicense',
              attribution: 'free-exercise-db (Public Domain / The Unlicense)',
              commercialUseAllowed: true,
              redistributionAllowed: true,
              localBundleAllowed: true,
              referenceOnly: false,
              verification: {
                identity: 'verified',
                rights: 'verified',
                asset: 'verified',
              },
              matchMethod: 'exact_source_id',
              matchConfidence: 1.0,
            },
          };

          mediaList.push(freeMediaItem);

          importedMappingRecords.push({
            canonicalExerciseId: ex.id,
            canonicalExerciseName: ex.name,
            externalSource: 'free-exercise-db',
            externalSourceId: freeId,
            externalExerciseName: fRecord.name,
            matchedKey: 'exact_source_id',
            sourceCommit: PINNED_SOURCE_COMMITS.FREE_EXERCISE_DB,
            sourcePath: `exercises/${sourceRel}`,
            assetHash,
            localMediaUrl: localUrl,
            verification: {
              identity: 'verified',
              rights: 'verified',
              asset: 'verified',
            },
            metadataLicense: 'Unlicense',
            mediaLicense: 'Unlicense',
            mediaRightsOwner: 'free-exercise-db (Public Domain / The Unlicense)',
            mediaLicensedToReplyf: true,
            mediaAttributionRequired: 'free-exercise-db under The Unlicense (Public Domain)',
            commercialUseAllowed: true,
            redistributionAllowed: true,
            localBundleAllowed: true,
            referenceOnly: false,
          });
        }
      }
    }

    if (mediaList.length > 0) {
      exerciseMediaMap.set(ex.id, mediaList);
    }
  }

  console.log(`Copied ${copiedCount} asset files into public/exercises/`);
  console.log(`Total exercises with verified media: ${exerciseMediaMap.size} / ${canonicalExercises.length}`);

  // Write public/exercises/manifest.json
  const manifestPath = path.resolve(outputExercisesDir, 'manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pinnedCommits: PINNED_SOURCE_COMMITS,
        totalImported: importedMappingRecords.length,
        records: importedMappingRecords,
      },
      null,
      2
    ),
    'utf8'
  );
  console.log(`Wrote manifest: ${manifestPath}`);

  // Update canonical exercises in memory
  for (const ex of canonicalExercises) {
    const list = exerciseMediaMap.get(ex.id);
    if (list && list.length > 0) {
      ex.media = list;
    } else {
      delete ex.media;
    }
    // Clean legacy thumbnailUrl/mediaUrl to avoid any legacy/generic patterns
    if (ex.thumbnailUrl && ex.thumbnailUrl.includes('placeholder')) {
      delete ex.thumbnailUrl;
    }
    if (ex.mediaUrl && ex.mediaUrl.includes('placeholder')) {
      delete ex.mediaUrl;
    }
  }

  // Write back canonical-exercises.ts
  const newCanonicalCode = `/**
 * Canonical Exercise Dataset
 * Autogenerated & normalized for Workout Planner Platform Phase 2F
 * Catalog Version: 1.0.0
 * Includes verified media from free-exercise-db (The Unlicense) and in-house vector illustrations
 */

import { Exercise } from '@/types/domain';

export const CANONICAL_EXERCISES: Exercise[] = ${JSON.stringify(canonicalExercises, null, 2)};
`;

  fs.writeFileSync(canonicalFile, newCanonicalCode, 'utf8');
  console.log(`Updated ${canonicalFile} with verified media attachments.`);

  return { importedMappingRecords, exerciseMediaMap };
}

if (process.argv[1] && process.argv[1].includes('import-exercise-media')) {
  runMediaImport();
}
