"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export interface WorkoutGoal {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

interface GoalSelectionProps {
  onSelect: (goal: string) => void
  selectedGoal: string
}

export default function GoalSelection({ onSelect, selectedGoal }: GoalSelectionProps) {
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null)

  const goals: WorkoutGoal[] = [
    {
      id: "strength",
      name: "Strength Gain",
      description: "Build muscle strength through progressive overload training",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M5 8h1a4 4 0 0 1 0 8H5" />
          <path d="M7 16V8" />
          <path d="M17 16V8" />
          <path d="M5 12h14" />
        </svg>
      ),
    },
    {
      id: "hypertrophy",
      name: "Muscle Growth",
      description: "Focus on muscle size and definition with volume-oriented training",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M6 4v6a6 6 0 0 0 12 0V4" />
          <circle cx="12" cy="18" r="2" />
          <path d="M6 12h12" />
        </svg>
      ),
    },
    {
      id: "fatLoss",
      name: "Fat Loss",
      description: "Burn calories and improve metabolism with high-intensity workouts",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M16 6.5a4 4 0 0 1 4 4c0 2.16-.67 4.78-2 6.5-1.33 1.72-3.17 3-6 3s-4.67-1.28-6-3c-1.33-1.72-2-4.34-2-6.5a4 4 0 0 1 4-4c.7 0 1.37.25 2.08.7a5.11 5.11 0 0 1 3.92 0c.71-.45 1.38-.7 2.08-.7Z" />
          <path d="M18 4c-.5 0-1 .16-1.4.47-1.37.88-2.82.88-4.2 0a2.83 2.83 0 0 0-2.8 0c-1.37.88-2.82.88-4.2 0A2.08 2.08 0 0 0 4 4" />
        </svg>
      ),
    },
    {
      id: "endurance",
      name: "Endurance",
      description: "Improve stamina and cardiovascular health with longer workouts",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M19 11a7 7 0 0 1-7 7m7-7a7 7 0 1 0-7 7m7-7H5m7 7v-7" />
          <circle cx="12" cy="11" r="1" />
        </svg>
      ),
    },
    {
      id: "flexibility",
      name: "Flexibility",
      description: "Enhance range of motion and mobility with stretching routines",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M18 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
          <path d="M10 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
          <path d="m16 6-6 10" />
        </svg>
      ),
    },
    {
      id: "general",
      name: "General Fitness",
      description: "Balanced workout plan combining different training styles",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M12 22v-5" />
          <path d="m9 8 3-6 3 6" />
          <path d="m18 10-2.5-2.5" />
          <path d="m6 10 2.5-2.5" />
          <path d="M8 16a5 5 0 0 0 8 0" />
        </svg>
      ),
    },
  ]

  const cardStyle = "backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl"

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle className="text-indigo-900">What's your fitness goal?</CardTitle>
          <CardDescription className="text-indigo-700">
            Choose a goal that aligns with what you want to achieve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.03, translateY: -5 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={() => setHoveredGoal(goal.id)}
                onMouseLeave={() => setHoveredGoal(null)}
                onClick={() => onSelect(goal.id)}
                className={`relative cursor-pointer rounded-xl p-6 ${
                  selectedGoal === goal.id
                    ? "bg-indigo-100 border-2 border-indigo-400"
                    : "bg-white/80 border border-indigo-100"
                } transition-all duration-200 flex flex-col items-center text-center h-full`}
              >
                <motion.div
                  className={`text-center mb-3 ${
                    selectedGoal === goal.id || hoveredGoal === goal.id ? "text-indigo-600" : "text-indigo-400"
                  } transition-colors duration-200`}
                >
                  {goal.icon}
                </motion.div>
                <h3 className="font-semibold text-indigo-900 mb-2">{goal.name}</h3>
                <p className="text-sm text-indigo-700">{goal.description}</p>

                {selectedGoal === goal.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 right-3 h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      className="h-4 w-4"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={() => onSelect(selectedGoal || "general")}
            disabled={!selectedGoal}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
