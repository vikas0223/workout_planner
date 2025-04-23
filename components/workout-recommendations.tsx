"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp, ThumbsDown, Dumbbell, Clock, Activity, Heart } from "lucide-react"
import {
  type WorkoutRecommendation,
  getDiverseRecommendations,
  createUserProfile,
  addWorkoutRating,
  getWorkoutPlanById,
} from "@/lib/recommendation-engine"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useFavorites } from "@/lib/favorites-context"

interface WorkoutRecommendationsProps {
  formData: any
  onSelectWorkout: (workoutPlan: any) => void
  onAddToFavorites: (workoutPlan: any) => void
}

export default function WorkoutRecommendations({
  formData,
  onSelectWorkout,
  onAddToFavorites,
}: WorkoutRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ratedWorkouts, setRatedWorkouts] = useState<Record<string, number>>({})
  const [hoveredRating, setHoveredRating] = useState<{ id: string; rating: number } | null>(null)
  const [animatingCards, setAnimatingCards] = useState<string[]>([])
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()

  useEffect(() => {
    // Create a user profile from form data
    const profile = createUserProfile(formData)
    setUserProfile(profile)

    // Get recommendations
    const recs = getDiverseRecommendations(profile)
    setRecommendations(recs)
    setLoading(false)
  }, [formData])

  const handleRateWorkout = (workoutId: string, rating: number) => {
    if (!userProfile) return

    // Add animation flag
    setAnimatingCards([...animatingCards, workoutId])

    // Update local state for immediate feedback
    setRatedWorkouts({
      ...ratedWorkouts,
      [workoutId]: rating,
    })

    // Update user profile with new rating
    const updatedProfile = addWorkoutRating(userProfile, workoutId, rating)
    setUserProfile(updatedProfile)

    // If rating is 4 (heart/favorite), add to favorites
    if (rating === 4 && onAddToFavorites) {
      // Find the workout plan
      const workoutPlan = recommendations.find((rec) => rec.id === workoutId)
      if (workoutPlan) {
        onAddToFavorites(workoutPlan)
        addFavorite(workoutId)
      }
    }

    // Update recommendations based on new rating - with a slight delay for animation
    setTimeout(() => {
      const updatedRecs = getDiverseRecommendations(updatedProfile)
      setRecommendations(updatedRecs)

      // Remove animation flag after update
      setAnimatingCards(animatingCards.filter((id) => id !== workoutId))
    }, 600)
  }

  const handleSelectWorkout = (workoutId: string) => {
    const workoutPlan = getWorkoutPlanById(workoutId)
    if (workoutPlan) {
      // Add animation flag
      setAnimatingCards([...animatingCards, workoutId])

      // Delay the selection to allow for animation
      setTimeout(() => {
        onSelectWorkout(workoutPlan)
      }, 400)
    }
  }

  // Star rating component with animations
  const StarRating = ({ workoutId, maxRating = 5 }) => {
    const currentRating = ratedWorkouts[workoutId] || 0
    const isHovering = hoveredRating && hoveredRating.id === workoutId
    const hoverRating = isHovering ? hoveredRating.rating : 0

    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxRating }).map((_, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating({ id: workoutId, rating: i + 1 })}
            onMouseLeave={() => setHoveredRating(null)}
            onClick={() => handleRateWorkout(workoutId, i + 1)}
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{
                scale: currentRating > i || hoverRating > i ? [1, 1.2, 1] : 1,
                transition: { duration: 0.3 },
              }}
            >
              <Star
                className={`h-5 w-5 transition-colors duration-200 ${
                  currentRating > i
                    ? "text-yellow-500 fill-yellow-500"
                    : (hoverRating > i)
                      ? "text-yellow-300 fill-yellow-300"
                      : "text-gray-300"
                }`}
              />
            </motion.div>
          </motion.button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <motion.div
          animate={{
            rotate: 360,
            transition: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
          }}
          className="rounded-full h-8 w-8 border-b-2 border-indigo-600"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold text-indigo-900"
      >
        Recommended Workouts
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="text-indigo-700"
      >
        Based on your preferences and similar users' experiences
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <AnimatePresence>
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: animatingCards.includes(rec.id) ? [1, 0.5, 1] : 1,
                y: 0,
                scale: animatingCards.includes(rec.id) ? [1, 0.98, 1] : 1,
              }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              whileHover={{
                y: -5,
                boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 8px 10px -6px rgba(79, 70, 229, 0.1)",
              }}
              className="h-full"
            >
              <Card className="bg-white/60 border-indigo-200 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-indigo-900">{rec.name}</CardTitle>
                    <StarRating workoutId={rec.id} />
                  </div>
                  <CardDescription className="text-indigo-600 text-sm">{rec.reason}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2 flex-grow">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-indigo-600 border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors"
                    >
                      <Activity className="w-3 h-3" />
                      {rec.difficulty.charAt(0).toUpperCase() + rec.difficulty.slice(1)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-green-600 border-green-300 bg-green-50/50 hover:bg-green-100/50 transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      {rec.duration} min
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-purple-600 border-purple-300 bg-purple-50/50 hover:bg-purple-100/50 transition-colors"
                    >
                      <Dumbbell className="w-3 h-3" />
                      {rec.equipment.length} equipment
                    </Badge>
                  </div>
                  <div className="text-sm text-indigo-800">
                    <p>Targets: {rec.muscleGroups.join(", ")}</p>
                    <p className="mt-1">Equipment: {rec.equipment.join(", ")}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`rounded-full p-2 transition-colors duration-300 ${
                              ratedWorkouts[rec.id] === 5
                                ? "bg-green-100 text-green-600"
                                : "hover:bg-green-50 text-gray-500 hover:text-green-600"
                            }`}
                            onClick={() => handleRateWorkout(rec.id, 5)}
                          >
                            <ThumbsUp className={`h-4 w-4 ${ratedWorkouts[rec.id] === 5 ? "fill-green-200" : ""}`} />
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>I like this recommendation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`rounded-full p-2 transition-colors duration-300 ${
                              ratedWorkouts[rec.id] === 1
                                ? "bg-red-100 text-red-600"
                                : "hover:bg-red-50 text-gray-500 hover:text-red-600"
                            }`}
                            onClick={() => handleRateWorkout(rec.id, 1)}
                          >
                            <ThumbsDown className={`h-4 w-4 ${ratedWorkouts[rec.id] === 1 ? "fill-red-200" : ""}`} />
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Not interested in this</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`rounded-full p-2 transition-colors duration-300 ${
                              ratedWorkouts[rec.id] === 4
                                ? "bg-pink-100 text-pink-600"
                                : "hover:bg-pink-50 text-gray-500 hover:text-pink-600"
                            }`}
                            onClick={() => handleRateWorkout(rec.id, 4)}
                          >
                            <Heart className={`h-4 w-4 ${ratedWorkouts[rec.id] === 4 ? "fill-pink-200" : ""}`} />
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save to favorites</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-sm transition-all duration-300 hover:shadow"
                      onClick={() => handleSelectWorkout(rec.id)}
                    >
                      Use This Plan
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
