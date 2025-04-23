"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { UserProfile } from "@/lib/recommendation-engine"
import { Info } from "lucide-react"

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ProgressDashboardProps {
  userProfile: UserProfile
}

export default function ProgressDashboard({ userProfile }: ProgressDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const cardStyle = "backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl"

  // Helper function to get last n days
  const getLast30Days = () => {
    const dates = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push({
        date: date.toISOString().split("T")[0],
        display: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      })
    }
    return dates
  }

  // Process workout data
  const processWorkoutData = () => {
    const last30Days = getLast30Days()
    const completedWorkouts = userProfile?.completedWorkouts || []

    // Create a map of date to workout count
    const workoutsByDate = new Map()
    last30Days.forEach(({ date }) => {
      workoutsByDate.set(date, 0)
    })

    completedWorkouts.forEach((workout) => {
      const workoutDate = workout.date.split("T")[0]
      if (workoutsByDate.has(workoutDate)) {
        workoutsByDate.set(workoutDate, workoutsByDate.get(workoutDate) + 1)
      }
    })

    // Format the data for the chart
    return last30Days.map(({ date, display }) => ({
      date: display,
      workouts: workoutsByDate.get(date) || 0,
    }))
  }

  // Process difficulty data
  const processDifficultyData = () => {
    const completedWorkouts = userProfile?.completedWorkouts || []
    const difficultyLevels = ["beginner", "intermediate", "advanced"]

    // Count workouts by difficulty
    const countByDifficulty = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    }

    completedWorkouts.forEach((workout) => {
      if (workout.difficulty && difficultyLevels.includes(workout.difficulty)) {
        countByDifficulty[workout.difficulty]++
      }
    })

    // Format the data for the chart
    return [
      {
        name: "Beginner",
        value: countByDifficulty.beginner,
        color: "#10b981", // green-500
      },
      {
        name: "Intermediate",
        value: countByDifficulty.intermediate,
        color: "#6366f1", // indigo-500
      },
      {
        name: "Advanced",
        value: countByDifficulty.advanced,
        color: "#8b5cf6", // purple-500
      },
    ]
  }

  // Process muscle group data
  const processMuscleGroupData = () => {
    const completedWorkouts = userProfile?.completedWorkouts || []
    const muscleGroupCounts = {}

    completedWorkouts.forEach((workout) => {
      if (workout.muscleGroups && workout.muscleGroups.length > 0) {
        workout.muscleGroups.forEach((group) => {
          if (!muscleGroupCounts[group]) {
            muscleGroupCounts[group] = 0
          }
          muscleGroupCounts[group]++
        })
      }
    })

    // Format the data for the chart
    return Object.entries(muscleGroupCounts).map(([name, count]) => ({
      name,
      count,
    }))
  }

  // Calculate weekly average
  const calculateWeeklyAverage = () => {
    const completedWorkouts = userProfile?.completedWorkouts || []
    if (completedWorkouts.length === 0) return 0

    // Group workouts by week
    const workoutsByWeek = {}
    completedWorkouts.forEach((workout) => {
      const date = new Date(workout.date)
      const weekNumber = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))

      if (!workoutsByWeek[weekNumber]) {
        workoutsByWeek[weekNumber] = []
      }
      workoutsByWeek[weekNumber].push(workout)
    })

    // Calculate average workouts per week
    const totalWeeks = Object.keys(workoutsByWeek).length
    if (totalWeeks === 0) return 0

    return (completedWorkouts.length / totalWeeks).toFixed(1)
  }

  // Calculate total workout time
  const calculateTotalWorkoutTime = () => {
    const completedWorkouts = userProfile?.completedWorkouts || []
    let totalMinutes = 0

    completedWorkouts.forEach((workout) => {
      if (workout.duration) {
        totalMinutes += workout.duration
      }
    })

    return totalMinutes
  }

  // Calculate streak
  const calculateStreak = () => {
    const completedWorkouts = userProfile?.completedWorkouts || []
    if (completedWorkouts.length === 0) return 0

    // Sort workouts by date
    const sortedDates = completedWorkouts
      .map((workout) => new Date(workout.date).toISOString().split("T")[0])
      .sort()
      .reverse() // Most recent first

    // Check for consecutive days
    let streak = 1
    const today = new Date().toISOString().split("T")[0]

    // If no workout today, the streak could still be active from yesterday
    if (sortedDates[0] !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]

      if (sortedDates[0] !== yesterdayStr) {
        return 0 // The streak has been broken
      }
    }

    // Calculate streak
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = new Date(sortedDates[i])
      const prevDate = new Date(sortedDates[i + 1])

      // Check if dates are consecutive
      currentDate.setDate(currentDate.getDate() - 1)
      if (currentDate.toISOString().split("T")[0] === prevDate.toISOString().split("T")[0]) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  // Get data for the charts
  const workoutData = processWorkoutData()
  const difficultyData = processDifficultyData()
  const muscleGroupData = processMuscleGroupData()

  // Get statistics
  const totalWorkouts = userProfile?.completedWorkouts?.length || 0
  const weeklyAverage = calculateWeeklyAverage()
  const totalMinutes = calculateTotalWorkoutTime()
  const currentStreak = calculateStreak()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle className="text-indigo-900">Your Fitness Progress</CardTitle>
          <CardDescription className="text-indigo-700">Track your workout patterns and achievements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userProfile?.completedWorkouts?.length === 0 ? (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-700" />
              <AlertTitle className="text-blue-800">No workouts completed yet</AlertTitle>
              <AlertDescription className="text-blue-700">
                Your progress dashboard will populate once you've completed workouts. Get started with your personalized
                plan today!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/60 rounded-lg border border-indigo-100 p-4 text-center">
                  <h4 className="text-xs text-indigo-600 uppercase tracking-wider mb-1">Total Workouts</h4>
                  <p className="text-3xl font-bold text-indigo-900">{totalWorkouts}</p>
                </div>
                <div className="bg-white/60 rounded-lg border border-indigo-100 p-4 text-center">
                  <h4 className="text-xs text-indigo-600 uppercase tracking-wider mb-1">Weekly Avg</h4>
                  <p className="text-3xl font-bold text-indigo-900">{weeklyAverage}</p>
                </div>
                <div className="bg-white/60 rounded-lg border border-indigo-100 p-4 text-center">
                  <h4 className="text-xs text-indigo-600 uppercase tracking-wider mb-1">Total Minutes</h4>
                  <p className="text-3xl font-bold text-indigo-900">{totalMinutes}</p>
                </div>
                <div className="bg-white/60 rounded-lg border border-indigo-100 p-4 text-center">
                  <h4 className="text-xs text-indigo-600 uppercase tracking-wider mb-1">Current Streak</h4>
                  <p className="text-3xl font-bold text-indigo-900">{currentStreak}</p>
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Workout Frequency</TabsTrigger>
                  <TabsTrigger value="difficulty">Difficulty Progress</TabsTrigger>
                  <TabsTrigger value="focus">Muscle Focus</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="bg-white/60 rounded-lg border border-indigo-100 p-4">
                    <h3 className="text-lg font-medium text-indigo-900 mb-4">Workout Frequency</h3>
                    <ChartContainer
                      config={{
                        workouts: {
                          label: "Workouts",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={workoutData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "#6366f1" }}
                            axisLine={{ stroke: "#cbd5e1" }}
                            tickLine={{ stroke: "#cbd5e1" }}
                          />
                          <YAxis
                            tick={{ fill: "#6366f1" }}
                            axisLine={{ stroke: "#cbd5e1" }}
                            tickLine={{ stroke: "#cbd5e1" }}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="workouts"
                            stroke="var(--color-workouts)"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-workouts)", r: 4 }}
                            activeDot={{ r: 6, fill: "var(--color-workouts)" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </TabsContent>

                <TabsContent value="difficulty" className="mt-4">
                  <div className="bg-white/60 rounded-lg border border-indigo-100 p-4">
                    <h3 className="text-lg font-medium text-indigo-900 mb-4">Workout Difficulty</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={difficultyData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {difficultyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [`${value} workouts`, name]}
                            contentStyle={{
                              backgroundColor: "white",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="focus" className="mt-4">
                  <div className="bg-white/60 rounded-lg border border-indigo-100 p-4">
                    <h3 className="text-lg font-medium text-indigo-900 mb-4">Muscle Group Focus</h3>
                    <ChartContainer
                      config={{
                        count: {
                          label: "Workouts",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={muscleGroupData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            type="number"
                            tick={{ fill: "#6366f1" }}
                            axisLine={{ stroke: "#cbd5e1" }}
                            tickLine={{ stroke: "#cbd5e1" }}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fill: "#6366f1" }}
                            axisLine={{ stroke: "#cbd5e1" }}
                            tickLine={{ stroke: "#cbd5e1" }}
                            width={120}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="var(--color-count)" barSize={20} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
