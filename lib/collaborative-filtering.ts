import type { UserProfile, WorkoutRecommendation } from "./recommendation-engine"

// Calculate similarity between two users (0-1 scale)
export function calculateUserSimilarity(user1: UserProfile, user2: UserProfile): number {
  // Skip self-comparison
  if (user1.id === user2.id) return 0

  let similarityScore = 0
  let maxPossibleScore = 0

  // Demographic similarity (20% weight)
  // Age similarity (closer ages = more similar)
  const ageDiff = Math.abs(user1.age - user2.age)
  const ageScore = Math.max(0, 1 - ageDiff / 20) // Normalize age difference
  similarityScore += ageScore * 0.1
  maxPossibleScore += 0.1

  // Gender similarity
  if (user1.gender === user2.gender) {
    similarityScore += 0.1
  }
  maxPossibleScore += 0.1

  // Equipment preference similarity (25% weight)
  // Optimize by using Set for faster lookups
  const user2EquipmentSet = new Set(user2.preferredEquipment)
  const commonEquipment = user1.preferredEquipment.filter((eq) => user2EquipmentSet.has(eq)).length
  const equipmentScore =
    commonEquipment / Math.max(user1.preferredEquipment.length, user2.preferredEquipment.length) || 1
  similarityScore += equipmentScore * 0.25
  maxPossibleScore += 0.25

  // Muscle group preference similarity (25% weight)
  const user2MuscleGroupSet = new Set(user2.preferredMuscleGroups)
  const commonMuscleGroups = user1.preferredMuscleGroups.filter((mg) => user2MuscleGroupSet.has(mg)).length
  const muscleGroupScore =
    commonMuscleGroups / Math.max(user1.preferredMuscleGroups.length, user2.preferredMuscleGroups.length) || 1
  similarityScore += muscleGroupScore * 0.25
  maxPossibleScore += 0.25

  // Rating similarity (30% weight)
  // Find workouts rated by both users
  const user1RatedWorkoutsMap = new Map(user1.ratings.map((r) => [r.workoutPlanId, r.rating]))

  let ratingScore = 0
  let commonRatingsCount = 0

  for (const rating of user2.ratings) {
    if (user1RatedWorkoutsMap.has(rating.workoutPlanId)) {
      const user1Rating = user1RatedWorkoutsMap.get(rating.workoutPlanId)
      const ratingDiff = Math.abs(user1Rating - rating.rating)
      ratingScore += 1 - ratingDiff / 4 // Normalize rating difference
      commonRatingsCount++
    }
  }

  if (commonRatingsCount > 0) {
    ratingScore = ratingScore / commonRatingsCount
    similarityScore += ratingScore * 0.3
    maxPossibleScore += 0.3
  }

  // Normalize the final score if we couldn't calculate all components
  const finalScore = maxPossibleScore > 0 ? similarityScore / maxPossibleScore : 0

  return finalScore
}

// Find similar users for a given user
export function findSimilarUsers(currentUser: UserProfile, allUsers: UserProfile[], topN = 3): UserProfile[] {
  // Calculate similarity scores
  const similarityScores = allUsers
    .filter((user) => user.id !== currentUser.id)
    .map((user) => ({
      user,
      similarity: calculateUserSimilarity(currentUser, user),
    }))
    .sort((a, b) => b.similarity - a.similarity)

  // Return top N similar users
  return similarityScores.slice(0, topN).map((item) => item.user)
}

// Get workout recommendations based on collaborative filtering
export function getCollaborativeFilteringRecommendations(
  currentUser: UserProfile,
  allUsers: UserProfile[],
  allWorkouts: any[],
  topN = 3,
): WorkoutRecommendation[] {
  // Find similar users
  const similarUsers = findSimilarUsers(currentUser, allUsers)

  // Get workouts rated highly by similar users
  const currentUserWorkouts = new Set(currentUser.ratings.map((r) => r.workoutPlanId))

  const recommendedWorkouts: Map<string, { score: number; users: string[] }> = new Map()

  // Collect workout ratings from similar users
  for (const user of similarUsers) {
    // Calculate similarity with current user
    const similarity = calculateUserSimilarity(currentUser, user)

    // Consider only highly rated workouts (4-5 stars)
    const highlyRatedWorkouts = user.ratings
      .filter((r) => r.rating >= 4)
      .filter((r) => !currentUserWorkouts.has(r.workoutPlanId))

    // Add to recommendations with weighted scores
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

  // Convert to array and sort by score
  const recommendations = Array.from(recommendedWorkouts.entries())
    .map(([workoutPlanId, { score, users }]) => {
      const workout = allWorkouts.find((w) => w.id === workoutPlanId)
      if (!workout) return null

      return {
        id: workoutPlanId,
        score,
        reason: `Recommended because ${users.slice(0, 2).join(" and ")}${users.length > 2 ? " and others" : ""} enjoyed this workout`,
        muscleGroups: workout.muscleGroups,
        equipment: workout.equipment,
        difficulty: workout.difficulty,
        duration: workout.duration,
        source: "collaborative" as const,
        name: workout.name,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)

  return recommendations
}

// Get enhanced recommendations based on current workout
export function getEnhancedRecommendations(
  currentUser: UserProfile,
  currentWorkout: any,
  allUsers: UserProfile[],
  allWorkouts: any[],
  topN = 3,
): WorkoutRecommendation[] {
  // Get collaborative filtering recommendations
  const collaborativeRecs = getCollaborativeFilteringRecommendations(currentUser, allUsers, allWorkouts, topN)

  // Calculate similarity between workouts
  const workoutSimilarities = allWorkouts
    .map((workout) => {
      if (workout.id === currentWorkout.id) return null

      // Calculate similarity score based on muscle groups and equipment
      let similarityScore = 0

      // Muscle group similarity (60% weight)
      const currentMuscleGroups = new Set(currentWorkout.muscleGroups || [])
      const workoutMuscleGroups = new Set(workout.muscleGroups || [])

      let commonMuscleGroups = 0
      workoutMuscleGroups.forEach((group) => {
        if (currentMuscleGroups.has(group)) commonMuscleGroups++
      })

      const muscleGroupSimilarity =
        commonMuscleGroups / Math.max(currentMuscleGroups.size, workoutMuscleGroups.size) || 1

      // Equipment similarity (30% weight)
      const currentEquipment = new Set(currentWorkout.equipment || [])
      const workoutEquipment = new Set(workout.equipment || [])

      let commonEquipment = 0
      workoutEquipment.forEach((eq) => {
        if (currentEquipment.has(eq)) commonEquipment++
      })

      const equipmentSimilarity = commonEquipment / Math.max(currentEquipment.size, workoutEquipment.size) || 1

      // Difficulty similarity (10% weight)
      const difficultySimilarity = currentWorkout.difficulty === workout.difficulty ? 1 : 0

      // Calculate final similarity score
      similarityScore = muscleGroupSimilarity * 0.6 + equipmentSimilarity * 0.3 + difficultySimilarity * 0.1

      return {
        workout,
        similarityScore,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topN)

  // Convert to recommendation format
  const similarWorkoutRecs = workoutSimilarities.map(({ workout, similarityScore }) => ({
    id: workout.id,
    score: similarityScore,
    reason: `Matches your preferred ${workout.muscleGroups.some((g) => currentWorkout.muscleGroups?.includes(g)) ? "muscle groups" : ""} ${workout.muscleGroups.some((g) => currentWorkout.muscleGroups?.includes(g)) && workout.equipment.some((e) => currentWorkout.equipment?.includes(e)) ? "and" : ""} ${workout.equipment.some((e) => currentWorkout.equipment?.includes(e)) ? "equipment" : ""}`,
    muscleGroups: workout.muscleGroups,
    equipment: workout.equipment,
    difficulty: workout.difficulty,
    duration: workout.duration,
    source: "content-based" as const,
    name: workout.name,
  }))

  // Combine recommendations, prioritizing collaborative filtering
  const allRecs = [...collaborativeRecs]

  // Add content-based recommendations that aren't already included
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
