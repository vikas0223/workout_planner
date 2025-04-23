"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dumbbell, Clock, Target, User, Info, Heart } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useFavorites } from "@/components/favorites-context"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

export default function WorkoutPlan({ plan, cardStyle }) {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const planId = plan?.id || `plan_${Date.now()}`
  const isFav = isFavorite(planId)

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
    return string.charAt(0).toUpperCase() + string.replace(/-/g, " ").slice(1)
  }

  const handleFavoriteToggle = () => {
    if (isFav) {
      removeFavorite(planId)
    } else {
      addFavorite(planId)
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
                  <span className="block mb-2">Target: {selectedExercise.muscleGroup}</span>
                )}
                {selectedExercise.equipment && (
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
              {plan.goal && (
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
          <p className="text-indigo-700 mt-2">Difficulty: {capitalizeFirstLetter(plan.difficulty)}</p>
        </CardHeader>
        <CardContent>
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {plan.exercises.map((exercise, index) => (
              <motion.div key={index} variants={item}>
                <Card className="bg-white/60 border-indigo-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg text-indigo-900">{exercise.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-indigo-600"
                        onClick={() => setSelectedExercise(exercise)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
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
                          <p className="font-medium text-indigo-900">{exercise.muscleGroup}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </>
  )
}
