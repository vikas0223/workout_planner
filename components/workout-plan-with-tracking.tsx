"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dumbbell,
  Clock,
  Target,
  User,
  Info,
  Heart,
  CheckCircle,
  BarChart,
  Flame,
  Save,
  WifiOff,
  AlertTriangle,
  MessageSquare,
  Star,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useFavorites } from "./favorites-context"
import { useWorkoutCompletion } from "@/contexts/workout-completion-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import WorkoutFeedbackForm from "@/components/workout-feedback-form"

export default function WorkoutPlanWithTracking({ plan, cardStyle }) {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const {
    isExerciseCompleted,
    markExerciseComplete,
    getCompletionPercentage,
    getTotalCaloriesBurned,
    saveWorkoutPlan,
    addExerciseToFavorites,
    removeExerciseFromFavorites,
    isExerciseFavorite,
    isOfflineMode,
  } = useWorkoutCompletion()
  const router = useRouter()
  const { toast } = useToast()

  const [planId, setPlanId] = useState(`plan_${Date.now()}`)
  const [isFav, setIsFav] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [caloriesBurned, setCaloriesBurned] = useState(0)
  const [completingExercise, setCompletingExercise] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  useEffect(() => {
    // Set plan ID if it exists
    if (plan?.id) {
      setPlanId(plan.id)
    }

    // Check if plan is a favorite
    setIsFav(isFavorite(plan?.id || planId))

    // Update completion percentage and calories burned
    if (plan?.exercises) {
      try {
        setCompletionPercentage(getCompletionPercentage(planId, plan.exercises.length))
        setCaloriesBurned(getTotalCaloriesBurned(planId))
      } catch (error) {
        console.error("Error updating completion stats:", error)
        setError("Failed to load workout progress")
      }
    }
  }, [plan, planId, getCompletionPercentage, getTotalCaloriesBurned, isFavorite])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const capitalizeFirstLetter = (string) => {
    if (!string) return ""
    return string.charAt(0).toUpperCase() + string.replace(/-/g, " ").slice(1)
  }

  const handleFavoriteToggle = () => {
    try {
      if (isFav) {
        removeFavorite(planId)
      } else {
        addFavorite(planId)
      }
      setIsFav(!isFav)

      toast({
        title: isFav ? "Removed from favorites" : "Added to favorites",
        description: isFav ? "Workout plan removed from your favorites" : "Workout plan added to your favorites",
        variant: isFav ? "default" : "success",
      })
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: `Failed to ${isFav ? "remove from" : "add to"} favorites: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Calculate estimated calories for an exercise
  const calculateExerciseCalories = (exercise) => {
    if (!exercise) return 0

    // Base calories per minute based on exercise intensity
    let caloriesPerMinute = 5 // Default moderate intensity

    // Adjust based on exercise type
    if (exercise.muscleGroup === "Lower Body Push" || exercise.muscleGroup === "Lower Body Pull") {
      caloriesPerMinute = 7 // Higher for leg exercises
    } else if (exercise.muscleGroup === "Core") {
      caloriesPerMinute = 6 // Medium for core
    } else if (exercise.muscleGroup === "Upper Body Push" || exercise.muscleGroup === "Upper Body Pull") {
      caloriesPerMinute = 5 // Medium for upper body
    }

    // Adjust based on sets and reps
    const sets = exercise.sets || 3
    const reps = exercise.reps ? Number.parseInt(exercise.reps.toString().split("-")[1] || exercise.reps) : 10

    // Estimate duration in minutes (30 seconds per set)
    const durationMinutes = sets * 0.5

    // Calculate total calories
    return Math.round(caloriesPerMinute * durationMinutes * sets)
  }

  const handleCompleteExercise = async (exercise) => {
    if (!exercise || !exercise.name) {
      toast({
        title: "Error",
        description: "Invalid exercise data",
        variant: "destructive",
      })
      return
    }

    // Create a consistent ID for the exercise
    const exerciseId = `${exercise.name.replace(/\s+/g, "_").toLowerCase()}`

    // Set the current exercise as completing
    setCompletingExercise(exerciseId)
    setError(null)

    const caloriesBurned = calculateExerciseCalories(exercise)

    try {
      await markExerciseComplete(exerciseId, planId, caloriesBurned)

      // Update local state
      setCompletionPercentage(getCompletionPercentage(planId, plan.exercises.length))
      setCaloriesBurned(getTotalCaloriesBurned(planId))

      // Show success toast
      toast({
        title: "Exercise completed!",
        description: `You burned approximately ${caloriesBurned} calories.`,
        variant: "success",
      })

      // Add animation delay
      setTimeout(() => {
        setCompletingExercise(null)
      }, 500)
    } catch (error) {
      console.error("Error completing exercise:", error)
      setCompletingExercise(null)
      setError(`Failed to mark exercise as complete: ${error.message || "Unknown error"}`)

      // Show error toast
      toast({
        title: "Error",
        description: `Failed to mark exercise as complete: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const handleSaveWorkout = async () => {
    setIsSaving(true)
    setError(null)

    try {
      if (!plan) {
        throw new Error("No workout plan to save")
      }

      // Validate plan structure
      if (!plan.exercises || !Array.isArray(plan.exercises) || plan.exercises.length === 0) {
        throw new Error("Invalid workout plan: missing exercises")
      }

      // Deep clone the plan to avoid mutation issues
      let planToSave
      try {
        planToSave = JSON.parse(
          JSON.stringify({
            ...plan,
            // Ensure these properties exist with safe defaults
            muscleGroups: Array.isArray(plan.muscleGroups) ? plan.muscleGroups : [],
            difficulty: plan.difficulty || "intermediate",
            duration: plan.duration || 30,
            gender: plan.gender || null,
            goal: plan.goal || null,
            exercises: Array.isArray(plan.exercises)
              ? plan.exercises.map((ex) => ({
                  name: ex?.name || "Unnamed Exercise",
                  sets: ex?.sets || null,
                  reps: ex?.reps || null,
                  rest: ex?.rest || null,
                  duration: ex?.duration || null,
                  intensity: ex?.intensity || null,
                  muscleGroup: ex?.muscleGroup || null,
                  equipment: Array.isArray(ex?.equipment) ? ex.equipment : [],
                  instructions: ex?.instructions || null,
                }))
              : [],
          }),
        )
      } catch (parseError) {
        console.error("Error parsing workout plan:", parseError)
        throw new Error("Failed to process workout data: " + (parseError.message || "JSON parse error"))
      }

      console.log("Saving workout plan:", planToSave)
      const workoutId = await saveWorkoutPlan(planToSave)

      if (workoutId) {
        // Update plan ID if it changed
        if (workoutId !== planId) {
          setPlanId(workoutId)
        }

        toast({
          title: "Workout saved!",
          description: isOfflineMode
            ? "Your workout plan has been saved locally. It will sync when you're back online."
            : "Your workout plan has been saved successfully.",
          variant: "success",
        })
      } else {
        throw new Error("Failed to save workout: No workout ID returned")
      }
    } catch (error) {
      console.error("Error saving workout:", error)
      setError(`Failed to save workout plan: ${error.message || "Unknown error"}`)

      toast({
        title: "Error",
        description: `Failed to save workout plan: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })

      // Show detailed error dialog for debugging
      setShowErrorDialog(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleExerciseFavorite = async (exercise) => {
    if (!exercise || !exercise.name) {
      toast({
        title: "Error",
        description: "Invalid exercise data",
        variant: "destructive",
      })
      return
    }

    // Ensure exercise has all required properties
    const exerciseToSave = {
      ...exercise,
      id: exercise.id || `${exercise.name.replace(/\s+/g, "_").toLowerCase()}`,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup || "",
      equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [],
    }

    const exerciseId = exerciseToSave.id
    const isFavorite = isExerciseFavorite(exerciseId)

    try {
      if (isFavorite) {
        await removeExerciseFromFavorites(exerciseId)

        toast({
          title: "Removed from favorites",
          description: `${exercise.name} has been removed from your favorites.`,
          variant: "default",
        })
      } else {
        await addExerciseToFavorites(exerciseToSave)

        toast({
          title: "Added to favorites",
          description: `${exercise.name} has been added to your favorites.`,
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Error toggling exercise favorite:", error)

      // Show more detailed error message
      toast({
        title: "Error",
        description: `Failed to update favorites: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const viewDashboard = () => {
    router.push("/dashboard")
  }

  const handleFeedbackSubmit = (data) => {
    console.log("Feedback submitted:", data)
    // Here you would typically send this data to your backend
    toast({
      title: data.rating >= 4 ? "Thanks for your positive feedback!" : "Thanks for your feedback!",
      description: data.rating >= 4 ? "We're glad you enjoyed the workout." : "We'll use your feedback to improve.",
      variant: data.rating >= 4 ? "success" : "default",
    })
    setShowFeedbackModal(false)
  }

  return (
    <>
      {/* Exercise Guidance Dialog */}
      {selectedExercise && (
        <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-indigo-900">{selectedExercise.name}</DialogTitle>
              <DialogDescription className="text-indigo-700">
                {selectedExercise.muscleGroup && (
                  <span className="block mb-2">Target: {selectedExercise.muscleGroup}</span>
                )}
                {selectedExercise.equipment && Array.isArray(selectedExercise.equipment) && (
                  <span className="block mb-2">Equipment: {selectedExercise.equipment.join(", ")}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-900 mb-2">How to perform:</h3>
                <p className="text-indigo-800">
                  {selectedExercise.instructions ||
                    `Perform ${selectedExercise.name} with proper form, focusing on controlled movements and breathing. Start with a lighter weight to master the technique before increasing intensity.`}
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-900 mb-2">Tips:</h3>
                <ul className="list-disc pl-5 text-indigo-800 space-y-1">
                  <li>Focus on proper form rather than speed</li>
                  <li>Breathe out during the exertion phase</li>
                  <li>Keep movements controlled and deliberate</li>
                  {selectedExercise.muscleGroup === "Core" && <li>Engage your core throughout the entire movement</li>}
                  {selectedExercise.equipment &&
                    Array.isArray(selectedExercise.equipment) &&
                    selectedExercise.equipment.includes("barbells") && (
                      <li>Start with lighter weights to master the technique</li>
                    )}
                </ul>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setSelectedExercise(null)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Error Details Dialog */}
      {showErrorDialog && (
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-600">Error Details</DialogTitle>
              <DialogDescription className="text-gray-700">Technical information about the error</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error saving workout</AlertTitle>
                <AlertDescription className="mt-2">{error || "An unknown error occurred"}</AlertDescription>
              </Alert>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Debugging Information:</h3>
                <p className="text-gray-800 text-sm font-mono whitespace-pre-wrap">
                  Plan ID: {planId || "Not set"}
                  <br />
                  Offline Mode: {isOfflineMode ? "Yes" : "No"}
                  <br />
                  Plan Structure: {plan ? "Valid" : "Invalid"}
                  <br />
                  Exercises Count: {plan?.exercises?.length || 0}
                  <br />
                  Muscle Groups: {plan?.muscleGroups ? JSON.stringify(plan.muscleGroups) : "None"}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowErrorDialog(false)} className="bg-gray-600 hover:bg-gray-700 text-white">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Feedback Form Dialog */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-md">
          <WorkoutFeedbackForm
            onSubmit={handleFeedbackSubmit}
            onClose={() => setShowFeedbackModal(false)}
            workoutName={plan?.name || "workout"}
          />
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <WorkoutFeedbackForm
            workoutId={planId}
            workoutName={plan?.name || "workout"}
            onSubmit={handleFeedbackSubmit}
            onClose={() => setShowFeedbackDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Card className={cardStyle || "bg-slate-800 border-slate-700"}>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-2xl text-indigo-900">Your Personalized Workout Plan</CardTitle>
            <div className="flex flex-wrap gap-2">
              {isOfflineMode && (
                <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-400">
                  <WifiOff className="w-3 h-3" />
                  Offline Mode
                </Badge>
              )}
              {plan?.goal && (
                <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-400">
                  <Target className="w-3 h-3" />
                  {capitalizeFirstLetter(plan.goal)}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1 text-purple-600 border-purple-400">
                <Dumbbell className="w-3 h-3" />
                {capitalizeFirstLetter(plan?.type || "Custom")}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-400">
                <Clock className="w-3 h-3" />
                {plan?.duration || 0} min
              </Badge>
              {plan?.gender && (
                <Badge variant="outline" className="flex items-center gap-1 text-indigo-600 border-indigo-400">
                  <User className="w-3 h-3" />
                  {capitalizeFirstLetter(plan.gender)}
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={handleFavoriteToggle}>
                      <Heart
                        className={`h-5 w-5 ${
                          isFav ? "fill-pink-500 text-pink-500" : "text-slate-400 hover:text-pink-500"
                        }`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isFav ? "Remove from favorites" : "Add to favorites"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <p className="text-indigo-700 mt-2">
            Difficulty: {capitalizeFirstLetter(plan?.difficulty || "intermediate")}
          </p>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Workout Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-700">Workout Progress</span>
              <span className="text-sm font-medium text-indigo-900">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />

            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-1 text-sm text-indigo-700">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{caloriesBurned} calories burned</span>
              </div>
              <Button variant="outline" size="sm" className="text-indigo-700 border-indigo-300" onClick={viewDashboard}>
                <BarChart className="h-4 w-4 mr-1" /> View Stats
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!plan || !plan.exercises || plan.exercises.length === 0 ? (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">No exercises found</AlertTitle>
              <AlertDescription className="text-amber-700">
                This workout plan doesn't contain any exercises. Try generating a new workout plan.
              </AlertDescription>
            </Alert>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              {plan.exercises.map((exercise, index) => {
                if (!exercise || !exercise.name) return null

                const exerciseId = `${exercise.name.replace(/\s+/g, "_").toLowerCase()}`
                const isCompleted = isExerciseCompleted(exerciseId)
                const isCurrentlyCompleting = completingExercise === exerciseId
                const isFavorite = isExerciseFavorite(exerciseId)

                return (
                  <motion.div key={index} variants={item}>
                    <Card
                      className={`bg-white/60 border-indigo-200 overflow-hidden ${
                        isCompleted ? "border-green-300 bg-green-50/30" : ""
                      }`}
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-lg text-indigo-900 flex items-center">
                            {exercise.name}
                            {isCompleted && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
                          </h3>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleToggleExerciseFavorite(exercise)}
                                  >
                                    <Star
                                      className={`h-4 w-4 ${
                                        isFavorite
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-400 hover:text-yellow-400"
                                      }`}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-indigo-600"
                              onClick={() => setSelectedExercise(exercise)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {exercise.sets && (
                            <div className="bg-indigo-100 rounded p-2">
                              <p className="text-xs text-indigo-600">Sets</p>
                              <p className="font-medium text-indigo-900">{exercise.sets}</p>
                            </div>
                          )}
                          {exercise.reps && (
                            <div className="bg-indigo-100 rounded p-2">
                              <p className="text-xs text-indigo-600">Reps</p>
                              <p className="font-medium text-indigo-900">{exercise.reps}</p>
                            </div>
                          )}
                          {exercise.rest && (
                            <div className="bg-indigo-100 rounded p-2">
                              <p className="text-xs text-indigo-600">Rest</p>
                              <p className="font-medium text-indigo-900">{exercise.rest}</p>
                            </div>
                          )}
                          {exercise.duration && (
                            <div className="bg-indigo-100 rounded p-2">
                              <p className="text-xs text-indigo-600">Duration</p>
                              <p className="font-medium text-indigo-900">{exercise.duration}</p>
                            </div>
                          )}
                          {exercise.intensity && (
                            <div className="bg-indigo-100 rounded p-2">
                              <p className="text-xs text-indigo-600">Intensity</p>
                              <p className="font-medium text-indigo-900">{exercise.intensity}</p>
                            </div>
                          )}
                          {exercise.muscleGroup && (
                            <div className="bg-indigo-100 rounded p-2">
                              <p className="text-xs text-indigo-600">Target</p>
                              <p className="font-medium text-indigo-900">{exercise.muscleGroup}</p>
                            </div>
                          )}
                        </div>

                        {/* Complete Button */}
                        <div className="mt-3 flex justify-end">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={isCompleted ? "completed" : "not-completed"}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Button
                                size="sm"
                                variant={isCompleted ? "outline" : "default"}
                                className={
                                  isCompleted
                                    ? "border-green-300 text-green-700"
                                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                                }
                                onClick={() => !isCompleted && handleCompleteExercise(exercise)}
                                disabled={isCompleted || isCurrentlyCompleting}
                              >
                                {isCurrentlyCompleting ? (
                                  <span className="flex items-center">
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Processing...
                                  </span>
                                ) : isCompleted ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" /> Completed
                                  </>
                                ) : (
                                  "Mark Complete"
                                )}
                              </Button>
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2">
          <Button variant="outline" className="border-indigo-300 text-indigo-700" onClick={viewDashboard}>
            <BarChart className="h-4 w-4 mr-2" /> View Dashboard
          </Button>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              onClick={() => setShowFeedbackModal(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Give Feedback
            </Button>
          </motion.div>

          <Button
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            onClick={handleSaveWorkout}
            disabled={isSaving || !plan || !plan.exercises || plan.exercises.length === 0}
          >
            {isSaving ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Workout
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
