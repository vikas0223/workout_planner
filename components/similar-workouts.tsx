"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp, ThumbsDown, Dumbbell, Clock, Activity } from "lucide-react"
import { getDiverseRecommendations, type UserProfile } from "@/lib/recommendation-engine"

interface SimilarWorkoutsProps {
  currentWorkout: any
  userProfile: UserProfile | null
  onSelectWorkout: (workout: any) => void
}

export default function SimilarWorkouts({ currentWorkout, userProfile, onSelectWorkout }: SimilarWorkoutsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ratedWorkouts, setRatedWorkouts] = useState<Record<string, number>>({})

  // Function to generate new recommendations
  const generateRecommendations = () => {
    setLoading(true)

    // Create a temporary profile if none exists
    const tempProfile = userProfile || {
      id: `temp_${Date.now()}`,
      name: currentWorkout.name || "User",
      gender: currentWorkout.gender || "neutral",
      age: 30,
      weight: "70kg",
      preferredEquipment: currentWorkout.equipment || [],
      preferredMuscleGroups: currentWorkout.muscleGroups || [],
      completedWorkouts: [],
      ratings: [],
    }

    // Add some randomness to ensure different recommendations each time
    const timestamp = Date.now()

    // Simulate API call delay
    setTimeout(() => {
      // Get recommendations based on current workout
      const recs = getDiverseRecommendations(
        tempProfile,
        {
          ...currentWorkout,
          id: `current_${timestamp}`, // Add unique ID to ensure different recommendations
        },
        4,
      )

      // Add mock data if no recommendations are returned
      const finalRecs = recs.length > 0 ? recs : generateMockRecommendations(currentWorkout)

      setRecommendations(finalRecs)
      setLoading(false)
    }, 1000)
  }

  // Generate mock recommendations if real ones aren't available
  const generateMockRecommendations = (workout) => {
    const difficulties = ["beginner", "intermediate", "advanced"]
    const durations = [30, 45, 60, 75]
    const muscleGroups = workout.muscleGroups || ["Upper Body Push", "Upper Body Pull", "Lower Body Push", "Core"]
    const equipment = workout.equipment || ["dumbbells", "bodyweight", "resistance bands"]
    const names = ["Full Body Workout", "Upper Body Focus", "Core Strength", "Lower Body Power"]
    const users = ["Alex", "Jordan", "Sam", "Taylor", "Morgan"]

    return Array.from({ length: 4 }).map((_, i) => {
      // Ensure some variety in the recommendations
      const selectedMuscleGroups = [muscleGroups[i % muscleGroups.length], muscleGroups[(i + 1) % muscleGroups.length]]

      const selectedEquipment = [equipment[i % equipment.length], equipment[(i + 1) % equipment.length]]

      return {
        id: `rec_${i}_${Date.now()}`,
        name: names[i % names.length],
        score: 0.8 - i * 0.1,
        reason: `Recommended because ${users[i % users.length]} and ${users[(i + 2) % users.length]} enjoyed this workout`,
        muscleGroups: selectedMuscleGroups,
        equipment: selectedEquipment,
        difficulty: difficulties[i % difficulties.length],
        duration: durations[i % durations.length],
        source: "collaborative",
      }
    })
  }

  // Toggle visibility of recommendations
  const toggleRecommendations = () => {
    if (!isVisible) {
      generateRecommendations()
    }
    setIsVisible(!isVisible)
  }

  // Handle rating a workout
  const handleRateWorkout = (workoutId, rating) => {
    setRatedWorkouts({
      ...ratedWorkouts,
      [workoutId]: rating,
    })
  }

  return (
    <div className="mt-4">
      <Button
        onClick={toggleRecommendations}
        variant="outline"
        className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
      >
        {isVisible ? "Hide Similar Workouts" : "Show Similar Workouts"}
      </Button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="mt-4 backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-indigo-900">Recommended Workouts</CardTitle>
                <CardDescription className="text-indigo-700">
                  Based on your preferences and similar users' experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendations.map((rec) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-lg border border-indigo-100 shadow-sm overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-indigo-900">{rec.name}</h3>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < Math.round(rec.score * 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-sm text-indigo-600 mb-3">{rec.reason}</p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline" className="flex items-center gap-1 text-indigo-600">
                              <Activity className="w-3 h-3" />
                              {rec.difficulty.charAt(0).toUpperCase() + rec.difficulty.slice(1)}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                              <Clock className="w-3 h-3" />
                              {rec.duration} min
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 text-purple-600">
                              <Dumbbell className="w-3 h-3" />
                              {rec.equipment.length} equipment
                            </Badge>
                          </div>

                          <div className="text-xs text-indigo-800 mb-3">
                            <p>Targets: {rec.muscleGroups.join(", ")}</p>
                            <p className="mt-1">Equipment: {rec.equipment.join(", ")}</p>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex space-x-2">
                              <button
                                className={`rounded-full p-1 ${ratedWorkouts[rec.id] === 1 ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-green-600"}`}
                                onClick={() => handleRateWorkout(rec.id, 1)}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </button>
                              <button
                                className={`rounded-full p-1 ${ratedWorkouts[rec.id] === -1 ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-red-600"}`}
                                onClick={() => handleRateWorkout(rec.id, -1)}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </button>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => onSelectWorkout(rec)}
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                            >
                              Use This Plan
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
