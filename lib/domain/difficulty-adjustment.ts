/**
 * Canonical Difficulty Adjustment Service
 * Consolidated from legacy lib/difficulty_adjuster.ts and lib/difficulty-adjuster.ts
 */

export interface CompletedWorkoutRef {
  workoutPlanId: string;
  name?: string;
  date: string | number | Date;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | string;
  duration?: number;
}

export interface WorkoutRatingRef {
  workoutPlanId: string;
  rating: number;
  feedback?: string;
  timestamp: number;
}

export interface DifficultyAdjustmentResult {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  reason: string;
}

export class DifficultyService {
  public static analyzeDifficultyAdjustment(
    completedWorkouts: CompletedWorkoutRef[] = [],
    workoutRatings: WorkoutRatingRef[] = []
  ): DifficultyAdjustmentResult {
    if (!completedWorkouts || completedWorkouts.length === 0) {
      return { difficulty: 'intermediate', reason: 'No workout history available' };
    }

    const recentWorkouts = completedWorkouts.slice(0, 5);
    const recentWorkoutsCount = recentWorkouts.length;

    const difficultyCount: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    recentWorkouts.forEach((w) => {
      if (w.difficulty && difficultyCount[w.difficulty] !== undefined) {
        difficultyCount[w.difficulty]++;
      }
    });

    const workoutsPerWeek = this.calculateWorkoutsPerWeek(completedWorkouts);
    const consistencyScore = this.calculateConsistencyScore(completedWorkouts);

    // Analyze feedback
    let feedbackSuggestion: 'easier' | 'harder' | 'neutral' = 'neutral';

    const ratedWorkouts = completedWorkouts
      .filter((w) => workoutRatings.some((r) => r.workoutPlanId === w.workoutPlanId))
      .map((w) => {
        const rating = workoutRatings.find((r) => r.workoutPlanId === w.workoutPlanId);
        return {
          ...w,
          rating: rating ? rating.rating : 0,
          feedback: rating ? rating.feedback || '' : '',
        };
      });

    ratedWorkouts.forEach((workout) => {
      const feedback = workout.feedback.toLowerCase();
      if (workout.rating <= 2 || feedback.includes('too difficult') || feedback.includes('too hard')) {
        feedbackSuggestion = 'easier';
      } else if (
        (workout.rating >= 4 && feedback.includes('too easy')) ||
        feedback.includes('too easy')
      ) {
        feedbackSuggestion = 'harder';
      }
    });

    const suggestedDifficulty = this.calculateSuggestedDifficulty(
      difficultyCount,
      workoutsPerWeek,
      consistencyScore,
      feedbackSuggestion,
      recentWorkoutsCount
    );

    const reason = this.generateAdjustmentReason(
      suggestedDifficulty,
      feedbackSuggestion,
      workoutsPerWeek,
      consistencyScore,
      recentWorkoutsCount
    );

    return {
      difficulty: suggestedDifficulty,
      reason,
    };
  }

  public static calculateWorkoutsPerWeek(workouts: CompletedWorkoutRef[]): number {
    if (!workouts || workouts.length < 2) return workouts?.length || 0;

    const firstDate = new Date(workouts[workouts.length - 1].date);
    const lastDate = new Date(workouts[0].date);
    const diffInWeeks = Math.max(
      1,
      Math.ceil((lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    );

    return Number.parseFloat((workouts.length / diffInWeeks).toFixed(1));
  }

  public static calculateConsistencyScore(workouts: CompletedWorkoutRef[]): number {
    if (!workouts || workouts.length < 2) return 5;

    const sorted = [...workouts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const intervals: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const current = new Date(sorted[i].date);
      const previous = new Date(sorted[i - 1].date);
      const diffInDays = (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000);
      intervals.push(diffInDays);
    }

    const avg = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const varianceSum = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0);
    const stdDev = Math.sqrt(varianceSum / intervals.length);

    return Math.min(10, Math.max(0, 10 - stdDev));
  }

  private static calculateSuggestedDifficulty(
    difficultyCount: Record<string, number>,
    workoutsPerWeek: number,
    consistencyScore: number,
    feedbackSuggestion: 'easier' | 'harder' | 'neutral',
    recentWorkoutsCount: number
  ): 'beginner' | 'intermediate' | 'advanced' {
    if (feedbackSuggestion === 'easier') return 'beginner';
    if (feedbackSuggestion === 'harder') return 'advanced';

    let mostCommon: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    let maxCount = -1;

    for (const [level, count] of Object.entries(difficultyCount)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = level as 'beginner' | 'intermediate' | 'advanced';
      }
    }

    if (consistencyScore > 7 && workoutsPerWeek > 3 && mostCommon === 'intermediate') {
      return 'advanced';
    }

    if (recentWorkoutsCount >= 5) {
      if (mostCommon === 'beginner' && (difficultyCount.beginner || 0) >= 4) {
        return 'intermediate';
      } else if (mostCommon === 'intermediate' && (difficultyCount.intermediate || 0) >= 4) {
        return 'advanced';
      }
    }

    return mostCommon;
  }

  private static generateAdjustmentReason(
    suggestedDifficulty: 'beginner' | 'intermediate' | 'advanced',
    feedbackSuggestion: 'easier' | 'harder' | 'neutral',
    workoutsPerWeek: number,
    consistencyScore: number,
    recentWorkoutsCount: number
  ): string {
    if (feedbackSuggestion === 'easier') {
      return 'Adjusted based on your feedback indicating workouts were too challenging';
    }
    if (feedbackSuggestion === 'harder') {
      return 'Increased difficulty based on your feedback that workouts were too easy';
    }
    if (suggestedDifficulty === 'advanced' && (workoutsPerWeek > 3 || consistencyScore > 7)) {
      return `Advanced workouts recommended based on your consistent training (${workoutsPerWeek} workouts/week, consistency score: ${consistencyScore.toFixed(1)}/10)`;
    }
    if (suggestedDifficulty === 'intermediate' && recentWorkoutsCount >= 5) {
      return 'Intermediate workouts recommended based on your progress with beginner workouts';
    }
    if (suggestedDifficulty === 'beginner' && recentWorkoutsCount < 5) {
      return 'Starting with beginner workouts to build a foundation';
    }
    return `Recommended ${suggestedDifficulty} difficulty based on your workout history`;
  }
}
