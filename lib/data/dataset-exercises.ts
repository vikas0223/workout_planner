/**
 * Extended Dataset Exercises (1,324 items from public/data/exercises.json)
 *
 * Each exercise provides:
 * - Card image in public/images/ (e.g. /images/0001-2gPfomN.jpg)
 * - Detail GIF in public/videos/ (e.g. /videos/0001-2gPfomN.gif)
 * - Structured metadata (primaryMuscles, equipment, movementPattern, difficulty, goals)
 * - Step-by-step instructions
 */

import datasetJson from './dataset-exercises.json';
import { Exercise } from '@/types/domain';

export const DATASET_EXERCISES: Exercise[] = datasetJson as unknown as Exercise[];
