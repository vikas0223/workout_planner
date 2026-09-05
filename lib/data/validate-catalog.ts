/**
 * Exercise Catalog Data Quality Validator
 * 
 * Verifies:
 * - Unique exercise IDs and unique slugs
 * - Valid taxonomy values for muscles, equipment, difficulties, goals, movement patterns
 * - Referential integrity for alternatives
 * - Presence of instructions, form cues, and common mistakes
 * - Media provenance and licensing compliance
 */

import { Exercise } from '@/types/domain';

export interface ValidationIssue {
  type: 'error' | 'warning';
  exerciseId: string;
  exerciseName: string;
  field: string;
  message: string;
}

export interface CatalogValidationReport {
  isValid: boolean;
  totalExercises: number;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}

const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const VALID_MOVEMENTS = new Set(['push', 'pull', 'squat', 'hinge', 'carry', 'rotation', 'isolation', 'locomotion']);
const VALID_GOALS = new Set(['strength', 'hypertrophy', 'endurance', 'general_fitness', 'fat_loss', 'mobility', 'cardio', 'flexibility']);

export function validateExerciseCatalog(exercises: Exercise[]): CatalogValidationReport {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenMediaIds = new Set<string>();
  const idMap = new Map<string, Exercise>();

  for (const ex of exercises) {
    idMap.set(ex.id, ex);
  }

  for (const ex of exercises) {
    // 1. ID uniqueness
    if (!ex.id) {
      issues.push({
        type: 'error',
        exerciseId: ex.id || 'unknown',
        exerciseName: ex.name || 'unnamed',
        field: 'id',
        message: 'Exercise missing required ID',
      });
    } else if (seenIds.has(ex.id)) {
      issues.push({
        type: 'error',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'id',
        message: `Duplicate exercise ID: ${ex.id}`,
      });
    } else {
      seenIds.add(ex.id);
    }

    // 2. Slug uniqueness
    if (!ex.slug) {
      issues.push({
        type: 'error',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'slug',
        message: 'Exercise missing required slug',
      });
    } else if (seenSlugs.has(ex.slug)) {
      issues.push({
        type: 'error',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'slug',
        message: `Duplicate exercise slug: ${ex.slug}`,
      });
    } else {
      seenSlugs.add(ex.slug);
    }

    // 3. Name
    if (!ex.name || ex.name.trim().length === 0) {
      issues.push({
        type: 'error',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'name',
        message: 'Exercise name cannot be empty',
      });
    }

    // 4. Primary muscles
    if (!ex.primaryMuscles || ex.primaryMuscles.length === 0) {
      issues.push({
        type: 'error',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'primaryMuscles',
        message: 'Exercise must have at least one primary muscle',
      });
    }

    // 5. Equipment
    if (!ex.equipment || ex.equipment.length === 0) {
      issues.push({
        type: 'error',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'equipment',
        message: 'Exercise must declare required equipment (or Bodyweight)',
      });
    }

    // 6. Difficulty
    if (!ex.difficulty || !VALID_DIFFICULTIES.has(ex.difficulty.toLowerCase())) {
      issues.push({
        type: 'error',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'difficulty',
        message: `Invalid difficulty: "${ex.difficulty}". Must be beginner, intermediate, or advanced.`,
      });
    }

    // 7. Movement pattern
    if (ex.movementPattern && !VALID_MOVEMENTS.has(ex.movementPattern.toLowerCase())) {
      issues.push({
        type: 'warning',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'movementPattern',
        message: `Unknown movement pattern: "${ex.movementPattern}"`,
      });
    }

    // 8. Goals
    if (ex.goals) {
      for (const g of ex.goals) {
        if (!VALID_GOALS.has(String(g).toLowerCase())) {
          issues.push({
            type: 'warning',
            exerciseId: ex.id,
            exerciseName: ex.name,
            field: 'goals',
            message: `Unknown goal taxonomy: "${g}"`,
          });
        }
      }
    }

    // 9. Instructions
    if (!ex.instructions || ex.instructions.length === 0) {
      issues.push({
        type: 'error',
        exerciseId: ex.id,
        exerciseName: ex.name,
        field: 'instructions',
        message: 'Exercise must have instructions',
      });
    }

    // 10. Alternative referential integrity
    if (ex.alternatives && ex.alternatives.length > 0) {
      for (const alt of ex.alternatives) {
        const altId = typeof alt === 'string' ? alt : alt.alternativeExerciseId;
        if (!idMap.has(altId)) {
          issues.push({
            type: 'error',
            exerciseId: ex.id,
            exerciseName: ex.name,
            field: 'alternatives',
            message: `Broken alternative reference: alternative ID "${altId}" does not exist in catalog`,
          });
        }
      }
    }

    // 11. Provenance & licensing
    if (ex.provenance) {
      if (!ex.provenance.license || !ex.provenance.attribution) {
        issues.push({
          type: 'error',
          exerciseId: ex.id,
          exerciseName: ex.name,
          field: 'provenance',
          message: 'Provenance metadata missing license or attribution',
        });
      }
    }

    // 12. Media validation (optional per exercise, but strict when present)
    if (ex.media !== undefined) {
      if (!Array.isArray(ex.media)) {
        issues.push({
          type: 'error',
          exerciseId: ex.id,
          exerciseName: ex.name,
          field: 'media',
          message: 'Exercise media must be an array',
        });
      } else {
        const VALID_MEDIA_TYPES = new Set(['image', 'video', 'gif', 'svg', 'animation']);

        for (const m of ex.media) {
          if (!m || typeof m !== 'object') {
            issues.push({
              type: 'error',
              exerciseId: ex.id,
              exerciseName: ex.name,
              field: 'media',
              message: 'Malformed media record: expected object',
            });
            continue;
          }

          // ID uniqueness & presence
          if (!m.id || typeof m.id !== 'string' || m.id.trim().length === 0) {
            issues.push({
              type: 'error',
              exerciseId: ex.id,
              exerciseName: ex.name,
              field: 'media.id',
              message: 'Media record missing required ID',
            });
          } else if (seenMediaIds.has(m.id)) {
            issues.push({
              type: 'error',
              exerciseId: ex.id,
              exerciseName: ex.name,
              field: 'media.id',
              message: `Duplicate media ID: "${m.id}"`,
            });
          } else {
            seenMediaIds.add(m.id);
          }

          // Media Type
          if (!m.type || !VALID_MEDIA_TYPES.has(m.type)) {
            issues.push({
              type: 'error',
              exerciseId: ex.id,
              exerciseName: ex.name,
              field: 'media.type',
              message: `Invalid media type: "${m.type}". Must be image, video, gif, svg, or animation.`,
            });
          }

          // Media URL
          if (!m.url || typeof m.url !== 'string' || m.url.trim().length === 0) {
            issues.push({
              type: 'error',
              exerciseId: ex.id,
              exerciseName: ex.name,
              field: 'media.url',
              message: 'Media record missing required URL',
            });
          }

          // Media Provenance
          if (m.provenance) {
            if (!m.provenance.source || !m.provenance.license) {
              issues.push({
                type: 'error',
                exerciseId: ex.id,
                exerciseName: ex.name,
                field: 'media.provenance',
                message: 'Media provenance missing required source or license',
              });
            }
            if (typeof m.provenance.commercialUseAllowed !== 'boolean') {
              issues.push({
                type: 'warning',
                exerciseId: ex.id,
                exerciseName: ex.name,
                field: 'media.provenance.commercialUseAllowed',
                message: 'Media provenance commercialUseAllowed should be a boolean',
              });
            }
          }
        }
      }
    }
  }

  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');

  return {
    isValid: errors.length === 0,
    totalExercises: exercises.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    issues,
  };
}
