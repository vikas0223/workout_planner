/**
 * Pure Recommendation Boundary
 */

import { Recommendation, UserProfile as DomainUserProfile } from '@/types/domain';
import { getCollaborativeFilteringRecommendations, getEnhancedRecommendations } from '@/lib/collaborative-filtering';
import { UserProfile as LegacyUserProfile } from '@/lib/recommendation-engine';

export interface RecommendationQuery {
  currentUser: DomainUserProfile;
  allUsers?: DomainUserProfile[];
  allWorkouts?: any[];
  currentWorkout?: any;
  limit?: number;
}

function toLegacyUserProfile(user: DomainUserProfile): LegacyUserProfile {
  return {
    id: user.id,
    name: user.name,
    gender: user.gender || 'male',
    age: user.age || 25,
    weight: String(user.weight || '70'),
    fitnessLevel: user.fitnessLevel || 'intermediate',
    preferredMuscleGroups: user.preferredMuscleGroups || [],
    preferredEquipment: user.preferredEquipment || [],
    completedWorkouts: [],
    ratings: user.ratings ? user.ratings.map((r) => ({
      workoutPlanId: r.workoutPlanId,
      rating: r.rating,
      timestamp: r.timestamp,
      feedback: r.feedback,
    })) : [],
  };
}

export class RecommendationService {
  public static getRecommendations(query: RecommendationQuery): Recommendation[] {
    const limit = query.limit || 3;
    const legacyCurrentUser = toLegacyUserProfile(query.currentUser);
    const legacyAllUsers = (query.allUsers || []).map(toLegacyUserProfile);
    const allWorkouts = query.allWorkouts || [];

    if (query.currentWorkout) {
      const recs = getEnhancedRecommendations(
        legacyCurrentUser,
        query.currentWorkout,
        legacyAllUsers,
        allWorkouts,
        limit
      );
      return recs.map((r) => ({
        id: r.id,
        workoutId: r.id,
        name: r.name || 'Recommended Workout',
        reason: r.reason,
        score: r.score,
        source: r.source === 'collaborative' ? 'collaborative' : 'content_based',
        muscleGroups: r.muscleGroups || [],
        equipment: r.equipment || [],
        difficulty: r.difficulty || 'intermediate',
        duration: r.duration || 45,
      }));
    }

    const recs = getCollaborativeFilteringRecommendations(
      legacyCurrentUser,
      legacyAllUsers,
      allWorkouts,
      limit
    );

    return recs.map((r) => ({
      id: r.id,
      workoutId: r.id,
      name: r.name || 'Recommended Workout',
      reason: r.reason,
      score: r.score,
      source: 'collaborative',
      muscleGroups: r.muscleGroups || [],
      equipment: r.equipment || [],
      difficulty: r.difficulty || 'intermediate',
      duration: r.duration || 45,
    }));
  }
}
