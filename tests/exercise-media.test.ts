/**
 * Replyf Exercise Media & Demonstration System Tests (Requirement 16)
 *
 * Covers:
 * - GIF selection
 * - Video selection
 * - SVG selection
 * - Image selection
 * - Thumbnail fallback
 * - MediaUrl fallback
 * - No-media fallback
 * - Broken GIF degradation
 * - Broken image degradation
 * - Broken SVG degradation
 * - All media broken degradation (fallback activation)
 * - Correct alt text generation
 * - Fallback accessibility attributes
 * - 4:3 layout reservation & aspect ratio
 * - Valid provenance validation
 * - Invalid provenance validation
 * - Invalid media type detection
 * - Duplicate media ID detection
 * - ExerciseCard -> ExerciseMedia integration
 * - ExerciseDetailDialog -> ExerciseMedia integration
 * - Same exercise -> same source media guarantee
 * - Minimum 12 verified core movements coverage audit
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { Exercise, ExerciseMedia as DomainExerciseMedia } from '@/types/domain';
import {
  resolveMediaCandidates,
  resolveActiveCandidate,
  isValidUrl,
} from '@/lib/exercises/media-resolver';
import { validateExerciseCatalog } from '@/lib/data/validate-catalog';
import { CANONICAL_EXERCISES } from '@/lib/data/canonical-exercises';
import {
  auditExerciseMediaCoverage,
  getMediaAuditSummary,
  HIGH_PRIORITY_EXERCISES,
} from '@/lib/data/exercise-media-audit';
import {
  normalizeExerciseName,
  matchExerciseDeterministically,
  getExerciseMapping,
  CANONICAL_TO_EXTERNAL_DATASET_MAP,
  ExternalExerciseRecord,
} from '@/lib/data/exercise-dataset-mapping';
import {
  REPLYF_TO_MUSCLE_MAP,
  MUSCLE_MAP_TO_REPLYF,
  mapReplyfToMuscleMap,
  mapMuscleMapToReplyf,
  getMuscleMapHighlightForExercise,
  getHeatmapFillColor,
  MUSCLE_MAP_PROVENANCE,
} from '@/lib/anatomy/muscle-map-integration';

function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-ex-001',
    name: 'Bench Press',
    slug: 'bench-press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Shoulders'],
    equipment: ['Barbell', 'Bench'],
    difficulty: 'intermediate',
    goals: ['strength', 'hypertrophy'],
    instructions: ['Lower bar to mid chest', 'Press explosively upward'],
    provenance: {
      source: 'in_house',
      license: 'CC-BY-4.0',
      attribution: 'Replyf Design System',
      commercialUseAllowed: true,
    },
    ...overrides,
  };
}

describe('Replyf Exercise Media Resolution & Priority Hierarchy (Section 3)', () => {
  it('1. Selects GIF / animation demonstration in detail context', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'm-img',
          type: 'image',
          url: '/images/bench.jpg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
        {
          id: 'm-gif',
          type: 'gif',
          url: '/images/bench.gif',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
        {
          id: 'm-svg',
          type: 'svg',
          url: '/images/bench.svg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
    });

    const candidates = resolveMediaCandidates(ex, 'detail');
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].type).toBe('animation');
    expect(candidates[0].url).toBe('/images/bench.gif');
  });

  it('2. Selects Video + poster when animation is not present in detail context', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'm-img',
          type: 'image',
          url: '/images/bench.jpg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
        {
          id: 'm-vid',
          type: 'video',
          url: '/videos/bench.mp4',
          posterUrl: '/videos/bench-poster.jpg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
    });

    const candidates = resolveMediaCandidates(ex, 'detail');
    expect(candidates[0].type).toBe('video');
    expect(candidates[0].url).toBe('/videos/bench.mp4');
    expect(candidates[0].posterUrl).toBe('/videos/bench-poster.jpg');
  });

  it('3. Selects SVG illustration for lightweight performance in card context', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'm-gif',
          type: 'gif',
          url: '/images/bench.gif',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
        {
          id: 'm-svg',
          type: 'svg',
          url: '/images/bench.svg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
    });

    const candidates = resolveMediaCandidates(ex, 'card');
    expect(candidates[0].type).toBe('svg');
    expect(candidates[0].url).toBe('/images/bench.svg');
  });

  it('4. Selects static image when SVG and animations are not present', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'm-img',
          type: 'image',
          url: '/images/bench.png',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
    });

    const candidates = resolveMediaCandidates(ex, 'card');
    expect(candidates[0].type).toBe('image');
    expect(candidates[0].url).toBe('/images/bench.png');
  });

  it('5. Falls back to thumbnailUrl when media array is empty', () => {
    const ex = createMockExercise({
      media: [],
      thumbnailUrl: '/thumbnails/bench-thumb.svg',
    });

    const candidates = resolveMediaCandidates(ex, 'card');
    expect(candidates.length).toBe(1);
    expect(candidates[0].url).toBe('/thumbnails/bench-thumb.svg');
    expect(candidates[0].type).toBe('svg');
  });

  it('6. Falls back to mediaUrl when media array and thumbnailUrl are missing', () => {
    const ex = createMockExercise({
      media: [],
      thumbnailUrl: undefined,
      mediaUrl: 'https://images.replyf.test/bench-photo.jpg',
    });

    const candidates = resolveMediaCandidates(ex, 'card');
    expect(candidates.length).toBe(1);
    expect(candidates[0].url).toBe('https://images.replyf.test/bench-photo.jpg');
    expect(candidates[0].type).toBe('image');
  });

  it('7. Returns empty candidate list for exercise with no media (triggers neutral fallback)', () => {
    const ex = createMockExercise({
      media: [],
      thumbnailUrl: undefined,
      mediaUrl: undefined,
    });

    const candidates = resolveMediaCandidates(ex, 'card');
    expect(candidates.length).toBe(0);

    const active = resolveActiveCandidate(candidates, new Set());
    expect(active).toBeNull();
  });
});

describe('Runtime Failure Handling & Graceful Degradation (Section 15)', () => {
  it('gracefully degrades from broken GIF to next candidate (SVG/image)', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'm-gif',
          type: 'gif',
          url: '/broken/anim.gif',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
        {
          id: 'm-svg',
          type: 'svg',
          url: '/valid/illustration.svg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
    });

    const candidates = resolveMediaCandidates(ex, 'detail');
    expect(candidates[0].url).toBe('/broken/anim.gif');

    // Simulate GIF loading error
    const failedUrls = new Set<string>(['/broken/anim.gif']);
    const active = resolveActiveCandidate(candidates, failedUrls);

    expect(active).not.toBeNull();
    expect(active!.url).toBe('/valid/illustration.svg');
    expect(active!.type).toBe('svg');
  });

  it('gracefully degrades from broken SVG to static image', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'm-svg',
          type: 'svg',
          url: '/broken/vector.svg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
        {
          id: 'm-img',
          type: 'image',
          url: '/valid/photo.png',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
    });

    const candidates = resolveMediaCandidates(ex, 'card');
    expect(candidates[0].url).toBe('/broken/vector.svg');

    // Mark broken SVG
    const failedUrls = new Set<string>(['/broken/vector.svg']);
    const active = resolveActiveCandidate(candidates, failedUrls);

    expect(active).not.toBeNull();
    expect(active!.url).toBe('/valid/photo.png');
    expect(active!.type).toBe('image');
  });

  it('gracefully degrades from broken primary image to thumbnailUrl', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'm-img',
          type: 'image',
          url: '/broken/primary.jpg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
      thumbnailUrl: '/valid/backup-thumb.svg',
    });

    const candidates = resolveMediaCandidates(ex, 'card');
    expect(candidates.length).toBe(2);

    const failedUrls = new Set<string>(['/broken/primary.jpg']);
    const active = resolveActiveCandidate(candidates, failedUrls);

    expect(active).not.toBeNull();
    expect(active!.url).toBe('/valid/backup-thumb.svg');
  });

  it('returns null when ALL media candidates are broken (triggers polished neutral fallback without crash)', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'm-gif',
          type: 'gif',
          url: '/broken/1.gif',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
        {
          id: 'm-img',
          type: 'image',
          url: '/broken/2.jpg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
      thumbnailUrl: '/broken/3.svg',
    });

    const candidates = resolveMediaCandidates(ex, 'detail');
    const failedUrls = new Set<string>(['/broken/1.gif', '/broken/2.jpg', '/broken/3.svg']);
    const active = resolveActiveCandidate(candidates, failedUrls);

    // Completely safe - returns null which signals component to render neutral fallback
    expect(active).toBeNull();
  });
});

describe('URL Validation & Security Helper', () => {
  it('accepts valid absolute paths and secure URLs', () => {
    expect(isValidUrl('/images/exercises/barbell-squat.svg')).toBe(true);
    expect(isValidUrl('https://images.replyf.com/demo.gif')).toBe(true);
    expect(isValidUrl('http://localhost:3000/demo.mp4')).toBe(true);
    expect(isValidUrl('data:image/svg+xml;base64,PHN2Zz4...')).toBe(true);
  });

  it('rejects empty, invalid, or script injection URLs', () => {
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('   ')).toBe(false);
    expect(isValidUrl(null)).toBe(false);
    expect(isValidUrl(undefined)).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('blob:')).toBe(false);
  });
});

describe('Catalog Media Validation Rules (Requirement 14)', () => {
  it('accepts exercises with valid media records and valid provenance', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'valid-media-1',
          type: 'image',
          url: '/images/exercises/bench-press.svg',
          provenance: {
            source: 'in_house',
            license: 'CC-BY-4.0',
            attribution: 'Replyf Design System',
            commercialUseAllowed: true,
          },
        },
      ],
    });

    const report = validateExerciseCatalog([ex]);
    expect(report.isValid).toBe(true);
    expect(report.errorCount).toBe(0);
  });

  it('detects and flags duplicate media IDs across exercises', () => {
    const ex1 = createMockExercise({
      id: 'ex-1',
      slug: 'ex-1',
      media: [
        {
          id: 'duplicate-id-check',
          type: 'image',
          url: '/images/1.jpg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
    });
    const ex2 = createMockExercise({
      id: 'ex-2',
      slug: 'ex-2',
      media: [
        {
          id: 'duplicate-id-check',
          type: 'image',
          url: '/images/2.jpg',
          provenance: { source: 'in_house', license: 'CC-BY-4.0', attribution: 'Replyf', commercialUseAllowed: true },
        },
      ],
    });

    const report = validateExerciseCatalog([ex1, ex2]);
    expect(report.isValid).toBe(false);
    expect(
      report.issues.some((i) => i.field === 'media.id' && i.message.includes('Duplicate media ID'))
    ).toBe(true);
  });

  it('detects and flags invalid media types', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'invalid-type-check',
          // @ts-expect-error Testing invalid runtime value
          type: 'flash_animation',
          url: '/images/1.swf',
        },
      ],
    });

    const report = validateExerciseCatalog([ex]);
    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.field === 'media.type')).toBe(true);
  });

  it('detects and flags missing media URLs', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'missing-url-check',
          type: 'image',
          url: '',
        } as DomainExerciseMedia,
      ],
    });

    const report = validateExerciseCatalog([ex]);
    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.field === 'media.url')).toBe(true);
  });

  it('detects and flags missing required provenance source or license', () => {
    const ex = createMockExercise({
      media: [
        {
          id: 'missing-prov-check',
          type: 'image',
          url: '/images/test.svg',
          provenance: {
            source: 'in_house',
            license: '',
            attribution: 'Replyf',
            commercialUseAllowed: true,
          },
        },
      ],
    });

    const report = validateExerciseCatalog([ex]);
    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.field === 'media.provenance')).toBe(true);
  });

  it('allows exercises without media array (media is optional in catalog)', () => {
    const ex = createMockExercise({
      media: undefined,
    });

    const report = validateExerciseCatalog([ex]);
    expect(report.isValid).toBe(true);
    expect(report.errorCount).toBe(0);
  });

  it('validates entire 166 canonical exercises catalog with zero media errors', () => {
    const report = validateExerciseCatalog(CANONICAL_EXERCISES);
    expect(report.isValid).toBe(true);
    expect(report.errorCount).toBe(0);
    expect(report.totalExercises).toBe(166);
  });
});

describe('Media Coverage Audit & Minimum Core Movements (Requirement 11)', () => {
  it('audits all 166 canonical exercises and verifies metadata fields', () => {
    const audit = auditExerciseMediaCoverage(CANONICAL_EXERCISES);
    expect(audit.length).toBe(166);

    for (const record of audit) {
      expect(record.exerciseId).toBeDefined();
      expect(record.exerciseName).toBeDefined();
      expect(record.mediaType).toBeDefined();
      expect(record.source).toBeDefined();
      expect(record.license).toBeDefined();
      expect(typeof record.commercialUseAllowed).toBe('boolean');
      expect(record.fallbackAllowed).toBe(true);
    }
  });

  it('explicitly verifies media coverage for all 16 Section W high-priority core movements', () => {
    const summary = getMediaAuditSummary(CANONICAL_EXERCISES);
    expect(summary.verifiedCoreExercises.length).toBe(18);

    for (const req of summary.verifiedCoreExercises) {
      expect(req.verified, `Expected media coverage for: ${req.name}`).toBe(true);
      expect(req.mediaPath).toBeDefined();
    }
  });

  it('matches exact specification list for Section 36 high-priority movements', () => {
    expect(HIGH_PRIORITY_EXERCISES).toEqual([
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
    ]);
  });
});

describe('Component Architecture & Design Contracts (Sections 4, 6, 7, 8, 9)', () => {
  const mediaComponentPath = path.resolve(__dirname, '../components/exercises/exercise-media.tsx');
  const cardComponentPath = path.resolve(__dirname, '../components/exercises/exercise-card.tsx');
  const detailComponentPath = path.resolve(__dirname, '../components/exercises/exercise-detail-dialog.tsx');

  const mediaSource = fs.readFileSync(mediaComponentPath, 'utf-8');
  const cardSource = fs.readFileSync(cardComponentPath, 'utf-8');
  const detailSource = fs.readFileSync(detailComponentPath, 'utf-8');

  it('enforces canonical ExerciseMedia component exists and has required props', () => {
    expect(mediaSource).toContain('export function ExerciseMedia(');
    expect(mediaSource).toContain('exercise: Exercise');
    expect(mediaSource).toContain('context?: ExerciseMediaContext');
  });

  it('enforces 4:3 fixed aspect ratio layout reservation (CLS = 0)', () => {
    expect(mediaSource).toContain('aspect-[4/3]');
    expect(mediaSource).toContain('w-full');
    expect(mediaSource).toContain('overflow-hidden');
  });

  it('enforces lazy loading and async decoding for card performance', () => {
    expect(mediaSource).toContain("loading={priority ? 'eager' : 'lazy'}");
    expect(mediaSource).toContain('decoding="async"');
  });

  it('enforces meaningful accessible alt text format', () => {
    expect(mediaSource).toContain('${exercise.name} exercise demonstration');
    expect(mediaSource).toContain('role="img"');
    expect(mediaSource).toContain('${exercise.name} demonstration unavailable');
  });

  it('enforces polished neutral fallback text and structure', () => {
    expect(mediaSource).toContain('Exercise demonstration unavailable');
    expect(mediaSource).toContain('exercise.primaryMuscles.join');
    expect(mediaSource).toContain('exercise.equipment');
  });

  it('confirms ExerciseCard renders ExerciseMedia with context="card"', () => {
    expect(cardSource).toContain('<ExerciseMedia');
    expect(cardSource).toContain('context="card"');
    expect(cardSource).toContain("import { ExerciseMedia } from './exercise-media';");
  });

  it('confirms ExerciseDetailDialog renders ExerciseMedia with context="detail"', () => {
    expect(detailSource).toContain('<ExerciseMedia');
    expect(detailSource).toContain('context="detail"');
    expect(detailSource).toContain("import { ExerciseMedia } from './exercise-media';");
  });

  it('strictly verifies NO generic SQUAT PATTERN or pattern placeholder remains in callers', () => {
    expect(cardSource).not.toContain('PATTERN');
    expect(cardSource).not.toContain('Sparkles');
    expect(detailSource).not.toContain('PATTERN');
    expect(detailSource).not.toContain('Sparkles');
  });

  it('guarantees identical source media URL is resolved between ExerciseCard and ExerciseDetailDialog', () => {
    for (const slug of ['barbell-squat', 'bench-press', 'deadlift', 'pull-ups', 'overhead-press']) {
      const ex = CANONICAL_EXERCISES.find((e) => e.slug === slug);
      if (!ex) continue;

      const cardCandidates = resolveMediaCandidates(ex, 'card');
      const detailCandidates = resolveMediaCandidates(ex, 'detail');

      expect(cardCandidates.length).toBeGreaterThan(0);
      expect(detailCandidates.length).toBeGreaterThan(0);
      // Same set of source URLs regardless of context-specific ordering
      const cardUrls = new Set(cardCandidates.map((c) => c.url));
      const detailUrls = new Set(detailCandidates.map((c) => c.url));
      expect(cardUrls).toEqual(detailUrls);
    }
  });
});

describe('Section Y: Exercise Mapping, External Dataset & MuscleMap Integration (Tests 17-21)', () => {
  // Test 17: Exercise Mapping
  it('17. performs deterministic exercise mapping via normalized names and movement patterns', () => {
    expect(normalizeExerciseName('Barbell Bench Press - Medium Grip')).toBe('benchpresmediumgrip');
    expect(normalizeExerciseName('Pull-Ups')).toBe('pullup');
    expect(normalizeExerciseName('Dips - Chest Version')).toBe('dipchestversion');
    expect(normalizeExerciseName('Barbell Back Squat')).toBe('backsquat');

    const sampleExternal: ExternalExerciseRecord[] = [
      {
        id: 'ext-bench',
        name: 'Barbell Bench Press - Medium Grip',
        level: 'intermediate',
        equipment: 'Barbell',
        primaryMuscles: ['Chest'],
        secondaryMuscles: ['Triceps'],
        instructions: ['Lower and press'],
        category: 'strength',
      },
    ];

    const mockEx = createMockExercise({
      id: 'canon-bench',
      name: 'Bench Press',
      equipment: ['Barbell'],
      primaryMuscles: ['Chest'],
    });

    const match = matchExerciseDeterministically(mockEx, sampleExternal);
    expect(match).not.toBeNull();
    expect(match!.record.id).toBe('ext-bench');
    expect(match!.matchKey).toBe('verified_name_equipment');
  });

  // Test 18: External Source Mapping & License Separation (Sections 3, 8, 44, 45)
  it('18. maintains external dataset mapping with strict provenance & free-exercise-db Unlicense verification', () => {
    const mappings = Object.values(CANONICAL_TO_EXTERNAL_DATASET_MAP);
    expect(mappings.length).toBeGreaterThanOrEqual(15);

    for (const mapping of mappings) {
      expect(mapping.canonicalExerciseId).toBeDefined();
      expect(mapping.externalSource).toBe('free-exercise-db');
      expect(mapping.metadataLicense).toBe('Unlicense');
      expect(mapping.mediaRightsOwner).toContain('free-exercise-db');
      expect(mapping.mediaLicensedToReplyf).toBe(true);
      expect(mapping.localBundleAllowed).toBe(true);
      expect(mapping.sourceCommit).toBe('a859101d633a01c4a1a920d6a8ce41dabba0705f');
      expect(mapping.verification?.identity).toBe('verified');
      expect(mapping.verification?.rights).toBe('verified');
      expect(mapping.verification?.asset).toBe('verified');
    }

    // Verify lookup helper with Section 8 fields
    const benchMapping = getExerciseMapping('00000000-0000-4000-8000-000012b3e666');
    expect(benchMapping).not.toBeNull();
    expect(benchMapping!.canonicalExerciseName).toBe('Bench Press');
    expect(benchMapping!.externalSourceId).toBe('Barbell_Bench_Press_-_Medium_Grip');
    expect(benchMapping!.replyfExerciseId).toBe('00000000-0000-4000-8000-000012b3e666');
    expect(benchMapping!.externalExerciseId).toBe('Barbell_Bench_Press_-_Medium_Grip');
    expect(benchMapping!.identityVerified).toBe(true);
  });

  // Section 43 & 44: Rights & Verification Filtering Tests
  it('strictly excludes unverified media, referenceOnly media, and restricted rights (Section 43 & 44)', () => {
    const exWithUnverified = createMockExercise({
      media: [
        {
          id: 'm-unverified-id',
          type: 'image',
          url: '/exercises/test/0.jpg',
          provenance: {
            source: 'free-exercise-db',
            license: 'Unlicense',
            attribution: 'free-exercise-db',
            commercialUseAllowed: true,
            verification: { identity: 'unverified', rights: 'verified', asset: 'verified' },
          },
        },
        {
          id: 'm-ref-only',
          type: 'gif',
          url: 'https://external.domain/gif.gif',
          provenance: {
            source: 'azilRababe',
            referenceOnly: true,
            license: 'MIT',
            attribution: 'azilRababe',
            commercialUseAllowed: false,
            verification: { identity: 'verified', rights: 'unverified', asset: 'verified' },
          },
        },
        {
          id: 'm-restricted',
          type: 'video',
          url: 'https://exercisedb.dev/video.mp4',
          provenance: {
            source: 'ExerciseDB',
            license: 'Proprietary',
            attribution: 'ExerciseDB',
            commercialUseAllowed: false,
            verification: { identity: 'verified', rights: 'restricted', asset: 'verified' },
          },
        },
        {
          id: 'm-approved',
          type: 'image',
          url: '/exercises/approved/0.jpg',
          provenance: {
            source: 'free-exercise-db',
            license: 'Unlicense',
            attribution: 'free-exercise-db',
            commercialUseAllowed: true,
            verification: { identity: 'verified', rights: 'verified', asset: 'verified' },
          },
        },
      ],
    });

    const candidates = resolveMediaCandidates(exWithUnverified, 'detail');
    // Only m-approved should be resolved; all 3 others must be excluded
    expect(candidates.length).toBe(1);
    expect(candidates[0].id).toBe('m-approved');
    expect(candidates[0].url).toBe('/exercises/approved/0.jpg');
  });

  // Section 43: Identity Safety Tests
  it('strictly blocks wrong exercise matches via safety signature (Section 43)', () => {
    const squatExternal: ExternalExerciseRecord[] = [
      {
        id: 'Barbell_Squat',
        name: 'Barbell Back Squat',
        equipment: 'Barbell',
        primaryMuscles: ['Quads'],
        category: 'strength',
      },
      {
        id: 'Incline_Bench_Press',
        name: 'Incline Barbell Bench Press',
        equipment: 'Barbell',
        primaryMuscles: ['Chest'],
        category: 'strength',
      },
      {
        id: 'Adductor_Machine',
        name: 'Adductor Machine',
        equipment: 'Machine',
        primaryMuscles: ['Adductors'],
        category: 'strength',
      },
    ];

    // Squat MUST NOT match Ankle Rotations
    const ankleEx = createMockExercise({ name: 'Ankle Rotations', primaryMuscles: ['Calves'], equipment: ['Bodyweight'] });
    expect(matchExerciseDeterministically(ankleEx, squatExternal)).toBeNull();

    // Squat MUST NOT match Abductor Machine
    const abductorEx = createMockExercise({ name: 'Abductor Machine', primaryMuscles: ['Glutes'], equipment: ['Machine'] });
    expect(matchExerciseDeterministically(abductorEx, squatExternal)).toBeNull();

    // Abductor Machine MUST NOT match Adductor Machine
    expect(matchExerciseDeterministically(abductorEx, [squatExternal[2]])).toBeNull();

    // Bench Press MUST NOT match Incline Bench Press
    const benchEx = createMockExercise({ name: 'Bench Press', primaryMuscles: ['Chest'], equipment: ['Barbell'] });
    expect(matchExerciseDeterministically(benchEx, [squatExternal[1]])).toBeNull();
  });

  // Section 45: Provenance Preservation Tests
  it('verifies all imported production media records preserve required provenance fields (Section 45)', () => {
    let checkedCount = 0;
    for (const ex of CANONICAL_EXERCISES) {
      if (!ex.media) continue;
      for (const m of ex.media) {
        if (m.provenance?.source === 'free-exercise-db') {
          checkedCount++;
          expect(m.provenance.source).toBe('free-exercise-db');
          expect(m.provenance.license).toBe('Unlicense');
          expect(m.provenance.sourceCommit).toBe('a859101d633a01c4a1a920d6a8ce41dabba0705f');
          expect(m.provenance.sourcePath).toBeDefined();
          expect(m.provenance.assetHash).toBeDefined();
          expect(m.provenance.assetHash?.length).toBe(64); // SHA-256
          expect(m.provenance.verification?.identity).toBe('verified');
          expect(m.provenance.verification?.rights).toBe('verified');
        }
      }
    }
    expect(checkedCount).toBeGreaterThanOrEqual(25);
  });

  // Test 19: MuscleMap Muscle Mapping
  it('19. provides bidirectional mapping between Replyf canonical muscles and MuscleMap geometry', () => {
    // Replyf -> MuscleMap
    expect(mapReplyfToMuscleMap('chest')).toEqual(['pectorals']);
    expect(mapReplyfToMuscleMap('quads')).toEqual(['quadriceps']);
    expect(mapReplyfToMuscleMap('biceps')).toEqual(['biceps']);
    expect(mapReplyfToMuscleMap('triceps')).toEqual(['triceps']);
    expect(mapReplyfToMuscleMap('front_deltoids')).toEqual(['deltoids-anterior', 'deltoids-lateral']);
    expect(mapReplyfToMuscleMap('rear_deltoids')).toEqual(['deltoids-posterior']);
    expect(mapReplyfToMuscleMap('abs')).toEqual(['rectus-abdominis']);
    expect(mapReplyfToMuscleMap('lats')).toEqual(['latissimus-dorsi']);
    expect(mapReplyfToMuscleMap('glutes')).toEqual(['gluteus-maximus', 'gluteus-medius']);
    expect(mapReplyfToMuscleMap('hamstrings')).toEqual(['hamstrings']);

    // MuscleMap -> Replyf
    expect(mapMuscleMapToReplyf('pectorals')).toBe('chest');
    expect(mapMuscleMapToReplyf('quadriceps')).toBe('quads');
    expect(mapMuscleMapToReplyf('biceps')).toBe('biceps');
    expect(mapMuscleMapToReplyf('triceps')).toBe('triceps');
    expect(mapMuscleMapToReplyf('latissimus-dorsi')).toBe('lats');

    // Exercise -> MuscleMap highlights (primary = 1.0, secondary = 0.5)
    const mockBench = createMockExercise({
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders'],
    });

    const highlights = getMuscleMapHighlightForExercise(mockBench);
    expect(highlights['pectorals']).toBe(1.0);
    expect(highlights['chest']).toBe(1.0);
    expect(highlights['triceps']).toBe(0.5);

    // Heatmap fill color progression
    expect(getHeatmapFillColor(undefined)).toBe('#cbd5e1'); // neutral base
    expect(getHeatmapFillColor(0.2)).toBe('#c7d2fe'); // low
    expect(getHeatmapFillColor(0.5)).toBe('#818cf8'); // medium
    expect(getHeatmapFillColor(0.9)).toBe('#4f46e5'); // high

    // Provenance verification: MuscleMap is MIT licensed
    expect(MUSCLE_MAP_PROVENANCE.license).toBe('MIT');
    expect(MUSCLE_MAP_PROVENANCE.source).toBe('MuscleMap');
    expect(MUSCLE_MAP_PROVENANCE.author).toBe('Melih Colpan');
  });

  // Test 20: ExerciseCard Integration
  it('20. verifies ExerciseCard integrates ExerciseMedia in fixed 4:3 container without pattern text', () => {
    const cardPath = path.resolve(__dirname, '../components/exercises/exercise-card.tsx');
    const cardContent = fs.readFileSync(cardPath, 'utf-8');

    expect(cardContent).toContain('<ExerciseMedia');
    expect(cardContent).toContain('context="card"');
    expect(cardContent).not.toContain('SQUAT PATTERN');
    expect(cardContent).not.toContain('PULL PATTERN');
    expect(cardContent).not.toContain('PUSH PATTERN');
    expect(cardContent).not.toContain('ISOLATION PATTERN');
  });

  // Test 21: ExerciseDetailDialog Integration
  it('21. verifies ExerciseDetailDialog integrates ExerciseMedia in detail context with full metadata hierarchy', () => {
    const detailPath = path.resolve(__dirname, '../components/exercises/exercise-detail-dialog.tsx');
    const detailContent = fs.readFileSync(detailPath, 'utf-8');

    expect(detailContent).toContain('<ExerciseMedia');
    expect(detailContent).toContain('context="detail"');
    expect(detailContent).toContain('aspect-[4/3]');
    expect(detailContent).toContain('showProvenance');
    expect(detailContent).toContain('Step-by-Step Instructions');
    expect(detailContent).toContain('Key Form Cues');
    expect(detailContent).toContain('Common Mistakes');
    expect(detailContent).toContain('Exercise Alternatives');
  });
});
