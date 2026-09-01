"use client"

import type { UserProfile, WorkoutRecommendation } from "./recommendation-engine"

export function calculateUserSimilarity(user1: UserProfile, user2: UserProfile): number {
  if (user1.id === user2.id) return 1.0

  let similarityScore = 0
  let maxPossibleScore = 0

  const fitnessLevelMap: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  }

  const level1 = fitnessLevelMap[(user1.fitnessLevel || "intermediate").toLowerCase()] || 2
  const level2 = fitnessLevelMap[(user2.fitnessLevel || "intermediate").toLowerCase()] || 2
  const levelDiff = Math.abs(level1 - level2)
  const fitnessScore = 1 - levelDiff / 2
  similarityScore += fitnessScore * 0.2
  maxPossibleScore += 0.2

  const ageDiff = Math.abs(user1.age - user2.age)
  const ageScore = Math.max(0, 1 - ageDiff / 20)
  similarityScore += ageScore * 0.1
  maxPossibleScore += 0.1

  if (user1.gender === user2.gender) {
    similarityScore += 0.1
  }
  maxPossibleScore += 0.1

  const user2EquipmentSet = new Set(user2.preferredEquipment)
  const commonEquipment = user1.preferredEquipment.filter((eq) => user2EquipmentSet.has(eq)).length
  const equipmentScore =
    commonEquipment / Math.max(user1.preferredEquipment.length, user2.preferredEquipment.length) || 1
  similarityScore += equipmentScore * 0.25
  maxPossibleScore += 0.25

  const user2MuscleGroupSet = new Set(user2.preferredMuscleGroups)
  const commonMuscleGroups = user1.preferredMuscleGroups.filter((mg) => user2MuscleGroupSet.has(mg)).length
  const muscleGroupScore =
    commonMuscleGroups / Math.max(user1.preferredMuscleGroups.length, user2.preferredMuscleGroups.length) || 1
  similarityScore += muscleGroupScore * 0.25
  maxPossibleScore += 0.25

  const user1RatedWorkoutsMap = new Map(user1.ratings.map((r) => [r.workoutPlanId, r.rating]))

  let ratingScore = 0
  let commonRatingsCount = 0

  for (const rating of user2.ratings) {
    if (user1RatedWorkoutsMap.has(rating.workoutPlanId)) {
      const user1Rating = user1RatedWorkoutsMap.get(rating.workoutPlanId)
      if (user1Rating !== undefined) {
        const ratingDiff = Math.abs(user1Rating - rating.rating)
        ratingScore += 1 - ratingDiff / 4
        commonRatingsCount++
      }
    }
  }

  if (commonRatingsCount > 0) {
    ratingScore = ratingScore / commonRatingsCount
    similarityScore += ratingScore * 0.3
    maxPossibleScore += 0.3
  }

  const finalScore = maxPossibleScore > 0 ? similarityScore / maxPossibleScore : 0
  return finalScore
}

export function findSimilarUsers(currentUser: UserProfile, allUsers: UserProfile[], topN = 3): UserProfile[] {
  const similarityScores = allUsers
    .filter((user) => user.id !== currentUser.id)
    .map((user) => ({
      user,
      similarity: calculateUserSimilarity(currentUser, user),
    }))
    .sort((a, b) => b.similarity - a.similarity)

  return similarityScores.slice(0, topN).map((item) => item.user)
}

export function getCollaborativeFilteringRecommendations(
  currentUser: UserProfile,
  allUsers: UserProfile[],
  allWorkouts: any[],
  topN = 3,
): WorkoutRecommendation[] {
  const similarUsers = findSimilarUsers(currentUser, allUsers)
  const currentUserWorkouts = new Set(currentUser.ratings.map((r) => r.workoutPlanId))
  const recommendedWorkouts: Map<string, { score: number; users: string[] }> = new Map()

  for (const user of similarUsers) {
    const similarity = calculateUserSimilarity(currentUser, user)
    const highlyRatedWorkouts = user.ratings
      .filter((r) => r.rating >= 4)
      .filter((r) => !currentUserWorkouts.has(r.workoutPlanId))

    for (const rating of highlyRatedWorkouts) {
      const currentScore = recommendedWorkouts.get(rating.workoutPlanId)
      if (currentScore) {
        recommendedWorkouts.set(rating.workoutPlanId, {
          score: currentScore.score + rating.rating * similarity,
          users: [...currentScore.users, user.name],
        })
      } else {
        recommendedWorkouts.set(rating.workoutPlanId, {
          score: rating.rating * similarity,
          users: [user.name],
        })
      }
    }
  }

  const recommendations: WorkoutRecommendation[] = []
  for (const [workoutPlanId, { score, users }] of recommendedWorkouts.entries()) {
    const workout = allWorkouts.find((w) => w.id === workoutPlanId)
    if (workout) {
      recommendations.push({
        id: workoutPlanId,
        score,
        reason: `Recommended because ${users.slice(0, 2).join(" and ")}${users.length > 2 ? " and others" : ""} enjoyed this workout`,
        muscleGroups: workout.muscleGroups,
        equipment: workout.equipment,
        difficulty: workout.difficulty,
        duration: workout.duration,
        source: "collaborative",
        name: workout.name,
      })
    }
  }

  return recommendations.sort((a, b) => b.score - a.score).slice(0, topN)
}

export function getEnhancedRecommendations(
  currentUser: UserProfile,
  currentWorkout: any,
  allUsers: UserProfile[],
  allWorkouts: any[],
  topN = 3,
): WorkoutRecommendation[] {
  const collaborativeRecs = getCollaborativeFilteringRecommendations(currentUser, allUsers, allWorkouts, topN)

  const workoutSimilarities: { workout: any; similarityScore: number }[] = []

  for (const workout of allWorkouts) {
    if (workout.id === currentWorkout.id) continue

    const currentMuscleGroups = new Set(currentWorkout.muscleGroups || [])
    const workoutMuscleGroups = new Set(workout.muscleGroups || [])

    let commonMuscleGroups = 0
    workoutMuscleGroups.forEach((group: any) => {
      if (currentMuscleGroups.has(group)) commonMuscleGroups++
    })

    const muscleGroupSimilarity =
      commonMuscleGroups / Math.max(currentMuscleGroups.size, workoutMuscleGroups.size) || 1

    const currentEquipment = new Set(currentWorkout.equipment || [])
    const workoutEquipment = new Set(workout.equipment || [])

    let commonEquipment = 0
    workoutEquipment.forEach((eq: any) => {
      if (currentEquipment.has(eq)) commonEquipment++
    })

    const equipmentSimilarity = commonEquipment / Math.max(currentEquipment.size, workoutEquipment.size) || 1
    const difficultySimilarity = currentWorkout.difficulty === workout.difficulty ? 1 : 0
    const similarityScore = muscleGroupSimilarity * 0.6 + equipmentSimilarity * 0.3 + difficultySimilarity * 0.1

    workoutSimilarities.push({ workout, similarityScore })
  }

  workoutSimilarities.sort((a, b) => b.similarityScore - a.similarityScore)

  const similarWorkoutRecs: WorkoutRecommendation[] = workoutSimilarities.slice(0, topN).map(({ workout, similarityScore }) => ({
    id: workout.id,
    score: similarityScore,
    reason: `Matches your preferred ${workout.muscleGroups?.some((g: string) => currentWorkout.muscleGroups?.includes(g)) ? "muscle groups" : ""} ${workout.equipment?.some((e: string) => currentWorkout.equipment?.includes(e)) ? "and equipment" : ""}`,
    muscleGroups: workout.muscleGroups,
    equipment: workout.equipment,
    difficulty: workout.difficulty,
    duration: workout.duration,
    source: "content-based",
    name: workout.name,
  }))

  const allRecs = [...collaborativeRecs]
  const existingIds = new Set(allRecs.map((r) => r.id))
  for (const rec of similarWorkoutRecs) {
    if (!existingIds.has(rec.id)) {
      allRecs.push(rec)
      existingIds.add(rec.id)
    }
    if (allRecs.length >= topN) break
  }

  return allRecs.slice(0, topN)
}
