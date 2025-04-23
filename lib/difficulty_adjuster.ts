import type { UserProfile, CompletedWorkout } from "./recommendation-engine"

export interface DifficultyAdjustmentResult {
  difficulty: string
  reason: string
}

/**
 * Analyzes user feedback and workout history to dynamically adjust difficulty
 */
export function analyzeDifficultyAdjustment(userProfile: UserProfile): DifficultyAdjustmentResult {
  if (!userProfile) {
    return { difficulty: "intermediate", reason: "Default difficulty level" }
  }

  // Get completed workouts sorted by date (newest first)
  const completedWorkouts = [...userProfile.completedWorkouts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  // Get workout ratings
  const workoutRatings = userProfile.ratings

  // If no completed workouts, return default
  if (completedWorkouts.length === 0) {
    return { difficulty: "intermediate", reason: "No workout history available" }
  }

  // Recent completion analysis (last 5 workouts)
  const recentWorkouts = completedWorkouts.slice(0, 5)
  const recentWorkoutsCount = recentWorkouts.length

  // Count difficulty levels in recent workouts
  const difficultyCount = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  }

  recentWorkouts.forEach((workout) => {
    if (workout.difficulty) {
      difficultyCount[workout.difficulty]++
    }
  })

  // Calculate progress metrics
  const workoutsPerWeek = calculateWorkoutsPerWeek(completedWorkouts)
  const consistencyScore = calculateConsistencyScore(completedWorkouts)
  const feedbackAnalysis = analyzeFeedback(workoutRatings, completedWorkouts)

  // Look for completed workouts that have ratings
  const ratedWorkouts = completedWorkouts
    .filter((workout) => workoutRatings.some((rating) => rating.workoutPlanId === workout.workoutPlanId))
    .map((workout) => {
      const rating = workoutRatings.find((r) => r.workoutPlanId === workout.workoutPlanId)
      return {
        ...workout,
        rating: rating ? rating.rating : 0,
        feedback: rating ? rating.feedback || "" : "",
      }
    })

  // Check for feedback indicating difficult/easy workouts
  let feedbackSuggestion = "neutral"
  const feedbackSuggestionReason = "based on your feedback"

  ratedWorkouts.forEach((workout) => {
    const feedback = workout.feedback?.toLowerCase() || ""

    if (workout.rating <= 2 || feedback.includes("too difficult") || feedback.includes("too hard")) {
      feedbackSuggestion = "easier"
    } else if ((workout.rating >= 4 && feedback.includes("too easy")) || feedback.includes("too easy")) {
      feedbackSuggestion = "harder"
    }
  })

  // Determine the most appropriate difficulty based on multiple factors
  const suggestedDifficulty = calculateSuggestedDifficulty(
    difficultyCount,
    workoutsPerWeek,
    consistencyScore,
    feedbackSuggestion,
    recentWorkoutsCount,
  )

  // Generate reason for the adjustment
  const reason = generateAdjustmentReason(
    suggestedDifficulty,
    feedbackSuggestion,
    workoutsPerWeek,
    consistencyScore,
    recentWorkoutsCount,
  )

  return {
    difficulty: suggestedDifficulty,
    reason,
  }
}

// Calculate average workouts per week
function calculateWorkoutsPerWeek(workouts: CompletedWorkout[]): number {
  if (workouts.length < 2) return workouts.length

  const firstDate = new Date(workouts[workouts.length - 1].date)
  const lastDate = new Date(workouts[0].date)
  const diffInWeeks = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))

  return Number.parseFloat((workouts.length / diffInWeeks).toFixed(1))
}

// Calculate consistency score (0-10)
function calculateConsistencyScore(workouts: CompletedWorkout[]): number {
  if (workouts.length < 2) return 5

  // Calculate days between workouts
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const intervals = []

  for (let i = 1; i < sortedWorkouts.length; i++) {
    const current = new Date(sortedWorkouts[i].date)
    const previous = new Date(sortedWorkouts[i - 1].date)
    const diffInDays = (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000)
    intervals.push(diffInDays)
  }

  // Calculate standard deviation of intervals (lower is more consistent)
  const avg = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
  const varianceSum = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0)
  const stdDev = Math.sqrt(varianceSum / intervals.length)

  // Convert to 0-10 scale (inverting so higher is more consistent)
  return Math.min(10, Math.max(0, 10 - stdDev))
}

// Analyze feedback from ratings
function analyzeFeedback(ratings, workouts) {
  const recentRatings = ratings.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)

  const avgRating =
    recentRatings.length > 0 ? recentRatings.reduce((sum, rating) => sum + rating.rating, 0) / recentRatings.length : 0

  return {
    avgRating,
    ratingTrend: calculateRatingTrend(ratings),
    feedbackSentiment: calculateFeedbackSentiment(ratings),
  }
}

// Calculate rating trend (increasing/decreasing/stable)
function calculateRatingTrend(ratings) {
  if (ratings.length < 3) return "stable"

  const sortedRatings = [...ratings].sort((a, b) => a.timestamp - b.timestamp).map((r) => r.rating)

  let increases = 0
  let decreases = 0

  for (let i = 1; i < sortedRatings.length; i++) {
    if (sortedRatings[i] > sortedRatings[i - 1]) increases++
    else if (sortedRatings[i] < sortedRatings[i - 1]) decreases++
  }

  if (increases > decreases * 2) return "increasing"
  if (decreases > increases * 2) return "decreasing"
  return "stable"
}

// Simple sentiment analysis on feedback
function calculateFeedbackSentiment(ratings) {
  const feedbackTexts = ratings.filter((r) => r.feedback).map((r) => r.feedback.toLowerCase())

  if (feedbackTexts.length === 0) return "neutral"

  const positiveWords = ["great", "good", "love", "enjoyed", "perfect", "amazing", "excellent"]
  const negativeWords = ["hard", "difficult", "challenging", "too", "couldn't", "struggle", "tough"]

  let positiveCount = 0
  let negativeCount = 0

  feedbackTexts.forEach((text) => {
    positiveWords.forEach((word) => {
      if (text.includes(word)) positiveCount++
    })

    negativeWords.forEach((word) => {
      if (text.includes(word)) negativeCount++
    })
  })

  if (positiveCount > negativeCount * 1.5) return "positive"
  if (negativeCount > positiveCount * 1.5) return "negative"
  return "neutral"
}

// Calculate suggested difficulty level
function calculateSuggestedDifficulty(
  difficultyCount,
  workoutsPerWeek,
  consistencyScore,
  feedbackSuggestion,
  recentWorkoutsCount,
) {
  // First check feedback - this overrides other factors
  if (feedbackSuggestion === "easier") {
    return "beginner"
  }

  if (feedbackSuggestion === "harder") {
    return "advanced"
  }

  // Determine most common recent difficulty
  let mostCommonDifficulty = "intermediate"
  let maxCount = 0

  for (const [difficulty, count] of Object.entries(difficultyCount)) {
    if (count > maxCount) {
      maxCount = count as number
      mostCommonDifficulty = difficulty
    }
  }

  // If consistency is high and workouts per week is high, consider increasing difficulty
  if (consistencyScore > 7 && workoutsPerWeek > 3 && mostCommonDifficulty === "intermediate") {
    return "advanced"
  }

  // If user has completed enough workouts at their level, consider progression
  if (recentWorkoutsCount >= 5) {
    if (mostCommonDifficulty === "beginner" && difficultyCount.beginner >= 4) {
      return "intermediate"
    } else if (mostCommonDifficulty === "intermediate" && difficultyCount.intermediate >= 4) {
      return "advanced"
    }
  }

  // Default to most common recent difficulty
  return mostCommonDifficulty
}

// Generate human-readable reason for adjustment
function generateAdjustmentReason(
  suggestedDifficulty,
  feedbackSuggestion,
  workoutsPerWeek,
  consistencyScore,
  recentWorkoutsCount,
) {
  if (feedbackSuggestion === "easier") {
    return "Adjusted based on your feedback indicating workouts were too challenging"
  }

  if (feedbackSuggestion === "harder") {
    return "Increased difficulty based on your feedback that workouts were too easy"
  }

  if (suggestedDifficulty === "advanced" && (workoutsPerWeek > 3 || consistencyScore > 7)) {
    return `Advanced workouts recommended based on your consistent training (${workoutsPerWeek} workouts/week, consistency score: ${consistencyScore.toFixed(1)}/10)`
  }

  if (suggestedDifficulty === "intermediate" && recentWorkoutsCount >= 5) {
    return "Intermediate workouts recommended based on your progress with beginner workouts"
  }

  if (suggestedDifficulty === "beginner" && recentWorkoutsCount < 5) {
    return "Starting with beginner workouts to build a foundation"
  }

  return `Recommended ${suggestedDifficulty} difficulty based on your workout history`
}
