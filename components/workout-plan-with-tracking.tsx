import { CalorieService } from "@/lib/domain/calories"
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dumbbell, Clock, Target, User, Info, Heart, AlertTriangle, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWorkoutCompletion } from "@/contexts/workout-completion-context"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

export default function WorkoutPlanWithTracking({ plan, cardStyle = "modern", onRegenerateWorkout }: { plan: any; cardStyle?: string; onRegenerateWorkout?: any }) {
  const [selectedExercise, setSelectedExercise] = useState<any>(null)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const { toast } = useToast()

  const {
    markExerciseComplete,
    isExerciseCompleted,
    getCompletionPercentage,
    getTotalCaloriesBurned,
    saveWorkoutPlan,
    isOfflineMode,
  } = useWorkoutCompletion()

  const planId = plan?.id || `plan_${Date.now()}`
  const exercises = plan?.exercises || []
  const completionPercentage = getCompletionPercentage(planId, exercises.length)
  const caloriesBurned = getTotalCaloriesBurned(planId)

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

  const capitalizeFirstLetter = (str: string) => { return str.charAt(0).toUpperCase() + str.replace(/-/g, " ").slice(1); }

  const handleSaveWorkout = async () => {
    if (isSaving) return

    setIsSaving(true)
    setSaveError(null)

    try {
      console.log("Saving workout plan:", plan)
      console.log("Plan ID:", planId)
      console.log("Offline Mode:", isOfflineMode ? "Yes" : "No")
      console.log("Plan Structure:", plan && typeof plan === "object" ? "Valid" : "Invalid")
      console.log("Exercises:", exercises.length)
      console.log("Muscle Groups:", JSON.stringify(plan?.muscleGroups || []))

      // Check if plan has exercises
      if (!exercises || exercises.length === 0) {
        throw new Error("Cannot save a workout plan with no exercises")
      }

      const savedId = await saveWorkoutPlan(plan)

      if (savedId) {
        setShowSaveConfirmation(true)
        toast({
          title: "Workout Saved",
          description: "Your workout plan has been saved successfully!",
          variant: "default",
        })
      } else {
        throw new Error("Failed to get saved workout ID")
      }
    } catch (error: any) {
      console.error("Error saving workout:", error)
      setSaveError(error.message || "Unknown error")
      toast({
        title: "Error Saving Workout",
        description: error.message || "An error occurred while saving your workout",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCompleteExercise = async (exercise: any, index: number) => {
    try {
      // Calculate estimated calories burned based on exercise type and duration
      const baseCalories = 5 // Base calories per minute
      const intensityMultiplier = plan.difficulty === "beginner" ? 0.8 : plan.difficulty === "advanced" ? 1.2 : 1

      const durationMinutes = 5 // Assume 5 minutes per exercise
      const caloriesBurned = Math.round(baseCalories * durationMinutes * intensityMultiplier)

      await markExerciseComplete(exercise.id || `exercise_${index}_${planId}`, planId, caloriesBurned)

      toast({
        title: "Exercise Completed",
        description: `Great job completing ${exercise.name}!`,
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error marking exercise as complete:", error)
      toast({
        title: "Error",
        description: "Could not mark exercise as complete",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {selectedExercise && (
        <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-indigo-900">{selectedExercise.name}</DialogTitle>
              <DialogDescription className="text-indigo-700">
                {selectedExercise.muscleGroup && (
                  <span className="block mb-2">Target: {capitalizeFirstLetter(selectedExercise.muscleGroup)}</span>
                )}
                {selectedExercise.equipment && (
                  <span className="block mb-2">
                    Equipment: {selectedExercise.equipment.map(capitalizeFirstLetter).join(", ")}
                  </span>
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
                  {selectedExercise.equipment && selectedExercise.equipment.includes("barbells") && (
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

      <Card className={cardStyle || "bg-slate-800 border-slate-700"}>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-2xl text-indigo-900">Your Personalized Workout Plan</CardTitle>
            <div className="flex flex-wrap gap-2">
              {isOfflineMode && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-orange-600 border-orange-400 bg-orange-50"
                >
                  <AlertTriangle className="w-3 h-3" />
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
                {capitalizeFirstLetter(plan.type || "Custom")}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-400">
                <Clock className="w-3 h-3" />
                {plan.duration} min
              </Badge>
              {plan.gender && (
                <Badge variant="outline" className="flex items-center gap-1 text-indigo-600 border-indigo-400">
                  <User className="w-3 h-3" />
                  {capitalizeFirstLetter(plan.gender)}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-indigo-700 mt-2">Difficulty: {capitalizeFirstLetter(plan.difficulty || "Intermediate")}</p>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-indigo-700">Workout Progress</span>
              <span className="text-sm font-medium text-indigo-900">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex items-center mt-2 text-sm text-indigo-700">
              <Heart className="w-4 h-4 mr-1 text-pink-500" />
              <span>{caloriesBurned} calories burned</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exercises && exercises.length > 0 ? (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              {exercises.map((exercise: any, index: number) => (
                <motion.div key={index} variants={item}>
                  <Card className="bg-white/60 border-indigo-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <h3 className="font-medium text-lg text-indigo-900">{exercise.name}</h3>
                          {isExerciseCompleted(exercise.id || `exercise_${index}_${planId}`) && (
                            <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">Completed</Badge>
                          )}
                        </div>
                        <div className="flex">
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
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
                            <p className="font-medium text-indigo-900">{capitalizeFirstLetter(exercise.muscleGroup)}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant={
                            isExerciseCompleted(exercise.id || `exercise_${index}_${planId}`) ? "outline" : "default"
                          }
                          className={
                            isExerciseCompleted(exercise.id || `exercise_${index}_${planId}`)
                              ? "border-green-500 text-green-700 hover:bg-green-50"
                              : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                          }
                          onClick={() => handleCompleteExercise(exercise, index)}
                          disabled={isExerciseCompleted(exercise.id || `exercise_${index}_${planId}`)}
                        >
                          {isExerciseCompleted(exercise.id || `exercise_${index}_${planId}`)
                            ? "Completed"
                            : "Mark as Complete"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-800" />
              <AlertTitle className="text-amber-800">No exercises found</AlertTitle>
              <AlertDescription className="text-amber-700">
                This workout plan doesn't contain any exercises. Try generating a new workout plan.
              </AlertDescription>
              {onRegenerateWorkout && (
                <Button
                  onClick={onRegenerateWorkout}
                  className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Workout
                </Button>
              )}
            </Alert>
          )}
        </CardContent>

        <div className="px-6 pb-6 flex flex-wrap gap-3 justify-between">
          <Button
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            onClick={() => (window.location.href = "/dashboard")}
          >
            View Dashboard
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={handleSaveWorkout}
                    disabled={isSaving || exercises.length === 0}
                    className={
                      exercises.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                    }
                  >
                    {isSaving ? "Saving..." : "Save Workout"}
                  </Button>
                </div>
              </TooltipTrigger>
              {exercises.length === 0 && (
                <TooltipContent side="top">
                  <p>Cannot save a workout with no exercises</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {saveError && (
          <div className="px-6 pb-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error saving workout</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          </div>
        )}
      </Card>
    </>
  )
}
