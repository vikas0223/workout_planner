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
  MINIMUM_VERIFIED_EXERCISES,
} from '@/lib/data/exercise-media-audit';

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
            // @ts-expect-error Testing missing license
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

  it('explicitly verifies media coverage for all 12 minimum required core movements', () => {
    const summary = getMediaAuditSummary(CANONICAL_EXERCISES);
    expect(summary.verifiedCoreExercises.length).toBe(12);

    for (const req of summary.verifiedCoreExercises) {
      expect(req.verified, `Expected media coverage for: ${req.name}`).toBe(true);
      expect(req.mediaPath).toBeDefined();
    }
  });

  it('matches exact specification list for verified movements', () => {
    expect(MINIMUM_VERIFIED_EXERCISES).toEqual([
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
      // Canonical asset URL parity between card and detail
      expect(cardCandidates[0].url).toBe(detailCandidates[0].url);
    }
  });
});
