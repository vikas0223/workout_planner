/**
 * Canonical Exercise Catalog Boundary
 * 
 * Provides pure, typed discovery queries over the canonical exercise dataset.
 * 
 * Rules:
 * - Pure functions only (no React hooks, timers, or direct IndexedDB/Supabase dependencies).
 * - Multi-category filter logic: OR within category, AND across categories.
 * - Deterministic scoring for alternatives & related exercises.
 * - Normalized whitespace & casing for search.
 */

import { CANONICAL_EXERCISES } from './canonical-exercises';
import { DATASET_EXERCISES } from './dataset-exercises';
import {
  CORE_CANONICAL_TO_DATASET_ID,
  isSafetySignatureViolated,
} from './exercise-dataset-mapping';
import { hasApprovedMedia } from '@/lib/exercises/media-resolver';
import {
  Exercise,
  FitnessGoal,
  ExperienceLevel,
  MovementPattern,
  ExerciseAlternative,
} from '@/types/domain';

export interface ExerciseFilter {
  goals?: (FitnessGoal | string)[];
  muscles?: string[];
  equipment?: string[];
  difficulty?: ExperienceLevel | string | (ExperienceLevel | string)[];
  movementPatterns?: (MovementPattern | string)[];
  joints?: string[];
  searchTerm?: string;
  sortBy?: 'relevance' | 'name-asc' | 'name-desc' | 'difficulty-asc' | 'difficulty-desc';
  limit?: number;
  offset?: number;
}

export interface ExerciseQueryResult {
  exercises: Exercise[];
  totalCount: number;
  hasMore: boolean;
}

const DIFFICULTY_WEIGHT: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

function normalizeString(val: string): string {
  return val.trim().toLowerCase().replace(/\s+/g, ' ');
}

function initializeCatalog(): Exercise[] {
  const combined: Exercise[] = [...CANONICAL_EXERCISES];
  const canonicalIds = new Set(CANONICAL_EXERCISES.map((c) => c.id));
  const canonicalNames = new Set(CANONICAL_EXERCISES.map((c) => normalizeString(c.name)));

  const datasetById = new Map<string, Exercise>();
  const datasetByName = new Map<string, Exercise>();
  for (const dex of DATASET_EXERCISES) {
    datasetById.set(dex.id, dex);
    datasetByName.set(normalizeString(dex.name), dex);
  }

  const claimedDatasetIds = new Set<string>();
  const claimedDatasetNames = new Set<string>();

  // Enrich canonical exercises with dataset media where matched and not already present
  for (let i = 0; i < combined.length; i++) {
    const c = combined[i];
    let match: Exercise | undefined;

    // 1. Resolve through mapping's verified target ID with safety checks
    const targetId = CORE_CANONICAL_TO_DATASET_ID[c.id];
    if (targetId) {
      const candidate = datasetById.get(targetId);
      if (
        candidate &&
        !isSafetySignatureViolated(
          c.name,
          c.equipment || [],
          candidate.name,
          (candidate.equipment && candidate.equipment[0]) || ''
        )
      ) {
        match = candidate;
      }
    }

    // 2. Fall back to normalized name equality if safety check passes
    if (!match) {
      const candidate = datasetByName.get(normalizeString(c.name));
      if (
        candidate &&
        !isSafetySignatureViolated(
          c.name,
          c.equipment || [],
          candidate.name,
          (candidate.equipment && candidate.equipment[0]) || ''
        )
      ) {
        match = candidate;
      }
    }

    if (match) {
      claimedDatasetIds.add(match.id);
      claimedDatasetNames.add(normalizeString(match.name));

      if (match.media && match.media.length > 0) {
        const existingUrls = new Set((c.media || []).map((m) => m.url));
        const mergedMedia = [...(c.media || [])];
        for (const m of match.media) {
          if (!existingUrls.has(m.url)) {
            mergedMedia.push(m);
            existingUrls.add(m.url);
          }
        }
        combined[i] = {
          ...c,
          media: mergedMedia,
          thumbnailUrl: c.thumbnailUrl || match.thumbnailUrl,
          mediaUrl: c.mediaUrl || match.mediaUrl,
        };
      }
    }
  }

  // Add non-conflicting dataset exercises without appending duplicate dataset exercises
  for (const dex of DATASET_EXERCISES) {
    const dexNorm = normalizeString(dex.name);
    if (
      !canonicalIds.has(dex.id) &&
      !claimedDatasetIds.has(dex.id) &&
      !canonicalNames.has(dexNorm) &&
      !claimedDatasetNames.has(dexNorm)
    ) {
      combined.push(dex);
    }
  }

  return combined;
}

export class ExerciseCatalog {
  private static version = '1.0.0';
  private static exercises: Exercise[] = initializeCatalog();

  public static getCatalogVersion(): string {
    return this.version;
  }

  public static listExercises(): Exercise[] {
    return this.exercises;
  }

  public static getExerciseById(id: string): Exercise | undefined {
    if (!id) return undefined;
    const normalized = normalizeString(id);
    return this.exercises.find(
      (ex) => ex.id === id || normalizeString(ex.slug || '') === normalized || normalizeString(ex.name) === normalized
    );
  }

  public static getExerciseByName(name: string): Exercise | undefined {
    if (!name) return undefined;
    const normalized = normalizeString(name);
    return this.exercises.find((ex) => normalizeString(ex.name) === normalized);
  }

  public static getExerciseBySlug(slug: string): Exercise | undefined {
    if (!slug) return undefined;
    const normalized = normalizeString(slug);
    return this.exercises.find((ex) => normalizeString(ex.slug || '') === normalized || normalizeString(ex.name) === normalized);
  }

  public static findExercisesByMuscle(muscle: string): Exercise[] {
    if (!muscle) return [];
    const m = normalizeString(muscle);
    return this.exercises.filter((ex) =>
      ex.primaryMuscles.some((pm) => normalizeString(pm).includes(m) || m.includes(normalizeString(pm)))
    );
  }

  public static findExercisesByEquipment(allowedEquipment: string[]): Exercise[] {
    if (!allowedEquipment || allowedEquipment.length === 0) return [];
    const normalizedAllowed = new Set<string>();
    for (const eq of allowedEquipment) {
      const lower = normalizeString(eq);
      normalizedAllowed.add(lower);
      if (lower.endsWith('s')) normalizedAllowed.add(lower.slice(0, -1));
      else normalizedAllowed.add(lower + 's');
    }
    normalizedAllowed.add('bodyweight');
    normalizedAllowed.add('none');

    return this.exercises.filter((ex) =>
      ex.equipment.every((eq) => {
        const eqLower = normalizeString(eq);
        return normalizedAllowed.has(eqLower) ||
          (eqLower.endsWith('s') && normalizedAllowed.has(eqLower.slice(0, -1))) ||
          normalizedAllowed.has(eqLower + 's');
      })
    );
  }

  public static findExercisesByJoint(joint: string): Exercise[] {
    if (!joint) return [];
    const j = normalizeString(joint);
    return this.exercises.filter((ex) =>
      ex.joints?.some((ej) => normalizeString(ej).includes(j))
    );
  }

  public static findExercisesByGoal(goal: string): Exercise[] {
    if (!goal) return [];
    const g = normalizeString(goal);
    return this.exercises.filter((ex) =>
      ex.goals.some((eg) => normalizeString(String(eg)) === g || normalizeString(String(eg)).includes(g))
    );
  }

  /**
   * Deterministic replacement candidates (Alternatives)
   * Prioritizes curated relationships, followed by same movement pattern + primary muscle,
   * with preference for exercises having working media demonstrations.
   */
  public static findAlternatives(exerciseId: string): Exercise[] {
    const exercise = this.getExerciseById(exerciseId);
    if (!exercise) return [];

    if (exercise.alternatives && exercise.alternatives.length > 0) {
      const results: Exercise[] = [];
      for (const alt of exercise.alternatives) {
        const altId = typeof alt === 'string' ? alt : alt.alternativeExerciseId;
        const target = this.getExerciseById(altId);
        if (target && target.id !== exercise.id && !results.some((r) => r.id === target.id)) {
          results.push(target);
        }
      }
      if (results.length > 0) return results;
    }

    // Deterministic fallback: match by primary muscle & movement pattern
    const candidates = this.exercises.filter(
      (ex) =>
        ex.id !== exercise.id &&
        ex.movementPattern === exercise.movementPattern &&
        ex.primaryMuscles.some((m) => exercise.primaryMuscles.includes(m))
    );

    // Prioritize candidates with available demonstrations
    return candidates
      .sort((a, b) => {
        const aHasMedia = hasApprovedMedia(a) ? 1 : 0;
        const bHasMedia = hasApprovedMedia(b) ? 1 : 0;
        return bHasMedia - aHasMedia;
      })
      .slice(0, 4);
  }

  /**
   * Specifically finds alternative exercises that have verified media demonstrations available in folders.
   */
  public static findAlternativesWithMedia(exerciseId: string): Exercise[] {
    const exercise = this.getExerciseById(exerciseId);
    if (!exercise) return [];

    return this.exercises
      .filter(
        (ex) =>
          ex.id !== exercise.id &&
          hasApprovedMedia(ex) &&
          (ex.movementPattern === exercise.movementPattern ||
            ex.primaryMuscles.some((m) => exercise.primaryMuscles.includes(m)))
      )
      .slice(0, 4);
  }

  /**
   * Deterministic exploration candidates (Related Exercises)
   * Uses weighted metadata score (shared muscles, shared equipment, shared goals)
   */
  public static findRelatedExercises(exerciseId: string): Exercise[] {
    const exercise = this.getExerciseById(exerciseId);
    if (!exercise) return [];

    const scored = this.exercises
      .filter((ex) => ex.id !== exercise.id)
      .map((ex) => {
        let score = 0;
        // Primary muscle overlap: +4 points
        if (ex.primaryMuscles.some((m) => exercise.primaryMuscles.includes(m))) score += 4;
        // Secondary muscle overlap: +2 points
        if (ex.secondaryMuscles?.some((m) => exercise.secondaryMuscles?.includes(m) || exercise.primaryMuscles.includes(m))) score += 2;
        // Equipment overlap: +2 points
        if (ex.equipment.some((eq) => exercise.equipment.includes(eq))) score += 2;
        // Movement pattern overlap: +3 points
        if (ex.movementPattern && ex.movementPattern === exercise.movementPattern) score += 3;
        // Goal overlap: +1 point
        if (ex.goals.some((g) => exercise.goals.includes(g))) score += 1;

        return { exercise: ex, score };
      })
      .filter((item) => item.score > 2)
      .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name));

    return scored.slice(0, 4).map((item) => item.exercise);
  }

  public static query(filter: ExerciseFilter): Exercise[] {
    return this.queryExercises(filter).exercises;
  }

  /**
   * Pure catalog query method.
   * Filter Combination Logic:
   * - Within one category (e.g. muscles: ['Chest', 'Shoulders']): OR
   * - Across categories (e.g. muscles + equipment + difficulty): AND
   */
  public static queryExercises(filter: ExerciseFilter): ExerciseQueryResult {
    let results = this.exercises;

    // 1. Search term filter (searches name, aliases, muscles, equipment, movementPattern, goals)
    if (filter.searchTerm && filter.searchTerm.trim().length > 0) {
      const term = normalizeString(filter.searchTerm);
      results = results.filter((ex) => {
        const nameMatch = normalizeString(ex.name).includes(term);
        const slugMatch = ex.slug ? normalizeString(ex.slug).includes(term) : false;
        const aliasMatch = ex.aliases?.some((a) => normalizeString(a).includes(term));
        const muscleMatch = ex.primaryMuscles.some((m) => normalizeString(m).includes(term)) ||
          ex.secondaryMuscles?.some((m) => normalizeString(m).includes(term));
        const eqMatch = ex.equipment.some((eq) => normalizeString(eq).includes(term));
        const moveMatch = ex.movementPattern ? normalizeString(ex.movementPattern).includes(term) : false;
        const goalMatch = ex.goals.some((g) => normalizeString(String(g)).includes(term));

        return nameMatch || slugMatch || aliasMatch || muscleMatch || eqMatch || moveMatch || goalMatch;
      });
    }

    // 2. Muscle filter (OR within category)
    if (filter.muscles && filter.muscles.length > 0) {
      const musclesLower = filter.muscles.map((m) => normalizeString(m));
      results = results.filter((ex) =>
        ex.primaryMuscles.some((pm) =>
          musclesLower.some((m) => normalizeString(pm).includes(m) || m.includes(normalizeString(pm)))
        ) ||
        ex.secondaryMuscles?.some((sm) =>
          musclesLower.some((m) => normalizeString(sm).includes(m) || m.includes(normalizeString(sm)))
        )
      );
    }

    // 3. Equipment filter (OR within category)
    if (filter.equipment && filter.equipment.length > 0) {
      const eqLower = filter.equipment.map((e) => normalizeString(e));
      results = results.filter((ex) =>
        ex.equipment.some((eq) =>
          eqLower.some((e) => normalizeString(eq).includes(e) || e.includes(normalizeString(eq)))
        )
      );
    }

    // 4. Difficulty filter (OR within category if array, or exact if string)
    if (filter.difficulty) {
      const diffArray = Array.isArray(filter.difficulty)
        ? filter.difficulty.map((d) => normalizeString(d))
        : [normalizeString(filter.difficulty)];
      if (diffArray.length > 0) {
        results = results.filter((ex) => diffArray.includes(normalizeString(ex.difficulty)));
      }
    }

    // 5. Goals filter (OR within category)
    if (filter.goals && filter.goals.length > 0) {
      const goalsLower = filter.goals.map((g) => normalizeString(String(g)));
      results = results.filter((ex) =>
        ex.goals.some((g) => goalsLower.includes(normalizeString(String(g))))
      );
    }

    // 6. Movement pattern filter (OR within category)
    if (filter.movementPatterns && filter.movementPatterns.length > 0) {
      const movesLower = filter.movementPatterns.map((m) => normalizeString(String(m)));
      results = results.filter((ex) =>
        ex.movementPattern && movesLower.includes(normalizeString(ex.movementPattern))
      );
    }

    // 7. Joints filter (OR within category)
    if (filter.joints && filter.joints.length > 0) {
      const jointsLower = filter.joints.map((j) => normalizeString(j));
      results = results.filter((ex) =>
        ex.joints?.some((j) => jointsLower.some((filterJ) => normalizeString(j).includes(filterJ)))
      );
    }

    // 8. Sorting
    const totalCount = results.length;
    const sorted = [...results];

    if (filter.sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filter.sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (filter.sortBy === 'difficulty-asc') {
      sorted.sort((a, b) => (DIFFICULTY_WEIGHT[a.difficulty] || 2) - (DIFFICULTY_WEIGHT[b.difficulty] || 2));
    } else if (filter.sortBy === 'difficulty-desc') {
      sorted.sort((a, b) => (DIFFICULTY_WEIGHT[b.difficulty] || 2) - (DIFFICULTY_WEIGHT[a.difficulty] || 2));
    } else if (filter.sortBy === 'relevance' && filter.searchTerm) {
      const term = normalizeString(filter.searchTerm);
      sorted.sort((a, b) => {
        const aExact = normalizeString(a.name) === term ? 10 : normalizeString(a.name).startsWith(term) ? 5 : 0;
        const bExact = normalizeString(b.name) === term ? 10 : normalizeString(b.name).startsWith(term) ? 5 : 0;
        return bExact - aExact;
      });
    }

    // 9. Pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || sorted.length;
    const paginated = sorted.slice(offset, offset + limit);

    return {
      exercises: paginated,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  public static queryPaginated(filter: ExerciseFilter): ExerciseQueryResult {
    return this.queryExercises(filter);
  }
}
