"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Activity, Clock, TrendingUp, Dumbbell, Flame, SpaceIcon as Yoga } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { UserProfile } from "@/lib/recommendation-engine"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkoutCompletion } from "@/contexts/workout-completion-context"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

interface EnhancedDashboardProps {
  userProfile: UserProfile
}

export default function EnhancedDashboard({ userProfile }: EnhancedDashboardProps) {
  const [isClient, setIsClient] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null)
  const [countUpValues, setCountUpValues] = useState({
    workoutsCompleted: 0,
    caloriesBurned: 0,
    totalMinutes: 0,
    progress: 0,
  })
  const [caloriesTimeframe, setCaloriesTimeframe] = useState("monthly")
  const { completedExercises } = useWorkoutCompletion()
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    totalExercisesCompleted: 0,
    totalCaloriesBurned: 0,
    totalDuration: 0,
    streakDays: 0,
  })

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)

    // Fetch user stats from Supabase
    const fetchUserStats = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const userId = localStorage.getItem("workoutAppUserId")

        if (userId) {
          const { data, error } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

          if (error) {
            console.error("Error fetching user stats:", error)
            return
          }

          if (data) {
            setUserStats({
              totalWorkouts: data.total_workouts || 0,
              totalExercisesCompleted: data.total_exercises_completed || 0,
              totalCaloriesBurned: data.total_calories_burned || 0,
              totalDuration: data.total_duration || 0,
              streakDays: data.streak_days || 0,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching user stats:", error)
      }
    }

    fetchUserStats()
  }, [])

  // Calculate stats from user profile and completed exercises
  useEffect(() => {
    if (!isClient) return

    // Calculate total calories burned from completed exercises
    const totalCaloriesBurned = Object.values(completedExercises).reduce(
      (sum, exercise) => sum + exercise.caloriesBurned,
      0,
    )

    // Use either the database stats or calculated values, whichever is higher
    const calculatedStats = {
      workoutsCompleted: Math.max(userStats.totalWorkouts, userProfile?.completedWorkouts?.length || 0),
      caloriesBurned: Math.max(userStats.totalCaloriesBurned, totalCaloriesBurned),
      totalMinutes: Math.max(
        userStats.totalDuration,
        userProfile?.completedWorkouts?.reduce((sum, workout) => sum + (workout.duration || 0), 0) || 0,
      ),
      progress: Math.min(100, Math.round(((userProfile?.completedWorkouts?.length || 0) / 12) * 100)),
    }

    // Animate count up
    const duration = 1500 // Animation duration in ms
    const steps = 30 // Number of steps in the animation
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps

      setCountUpValues({
        workoutsCompleted: Math.round(progress * calculatedStats.workoutsCompleted),
        caloriesBurned: Math.round(progress * calculatedStats.caloriesBurned),
        totalMinutes: Math.round(progress * calculatedStats.totalMinutes),
        progress: Math.round(progress * calculatedStats.progress),
      })

      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [userProfile, isClient, completedExercises, userStats])

  // Format minutes to hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Generate weekly workout data
  const getWeeklyWorkoutData = () => {
    if (!userProfile) return []

    const completedWorkouts = userProfile.completedWorkouts || []
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    // Get the current date and calculate the start of the week (Monday)
    const now = new Date()
    const dayOfWeek = now.getDay() || 7 // Convert Sunday (0) to 7
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1) // Monday
    startOfWeek.setHours(0, 0, 0, 0)

    // Initialize data with 0 minutes for each day
    const weekData = days.map((day, index) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + index)
      return {
        day,
        date: date.toISOString().split("T")[0],
        minutes: 0,
      }
    })

    // Fill in workout durations from completed exercises
    Object.values(completedExercises).forEach((exercise) => {
      const workoutDate = new Date(exercise.completedAt)
      const dayIndex = workoutDate.getDay() - 1 // Monday is 0

      if (dayIndex >= 0 && dayIndex < 7) {
        const dateStr = workoutDate.toISOString().split("T")[0]
        const weekDataIndex = weekData.findIndex((d) => d.date === dateStr)

        if (weekDataIndex !== -1) {
          // Add an estimated 3 minutes per exercise completion
          weekData[weekDataIndex].minutes += 3
        }
      }
    })

    // Also add data from user profile if available
    completedWorkouts.forEach((workout) => {
      const workoutDate = new Date(workout.date)
      const dayIndex = workoutDate.getDay() - 1 // Monday is 0

      if (dayIndex >= 0 && dayIndex < 7) {
        const dateStr = workoutDate.toISOString().split("T")[0]
        const weekDataIndex = weekData.findIndex((d) => d.date === dateStr)

        if (weekDataIndex !== -1) {
          weekData[weekDataIndex].minutes += workout.duration || 0
        }
      }
    })

    return weekData
  }

  // Generate calories data
  const getCaloriesData = () => {
    if (!userProfile) return []

    const completedWorkouts = userProfile.completedWorkouts || []

    // For monthly view
    if (caloriesTimeframe === "monthly") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const currentMonth = new Date().getMonth()

      // Initialize data with 0 calories for each month
      const monthlyData = months.map((month, index) => {
        // Calculate a realistic target based on month (higher in summer, lower in winter)
        const seasonalFactor = Math.abs((index - 6) / 6) // 0-1 value, higher in winter months
        const baseTarget = 2000 // Base calories target
        const target = Math.round(baseTarget * (1 - seasonalFactor * 0.3)) // Adjust by up to 30%

        return {
          name: month,
          calories: 0,
          target,
        }
      })

      // Fill in calories data from completed exercises
      Object.values(completedExercises).forEach((exercise) => {
        const workoutDate = new Date(exercise.completedAt)
        const monthIndex = workoutDate.getMonth()
        monthlyData[monthIndex].calories += exercise.caloriesBurned
      })

      // Also add data from user profile if available
      completedWorkouts.forEach((workout) => {
        const workoutDate = new Date(workout.date)
        const monthIndex = workoutDate.getMonth()

        // More accurate calorie calculation based on workout duration and difficulty
        let caloriesPerMinute = 8 // Base rate

        // Adjust based on difficulty
        if (workout.difficulty === "beginner") caloriesPerMinute = 6
        else if (workout.difficulty === "advanced") caloriesPerMinute = 10

        // Adjust based on muscle groups (larger muscle groups burn more calories)
        const hasLargeMuscleGroups = (workout.muscleGroups || []).some((group) =>
          ["Lower Body Push", "Lower Body Pull", "Upper Body Pull"].includes(group),
        )
        if (hasLargeMuscleGroups) caloriesPerMinute += 2

        const caloriesBurned = Math.round((workout.duration || 0) * caloriesPerMinute)
        monthlyData[monthIndex].calories += caloriesBurned
      })

      // Calculate deficit/surplus
      return monthlyData.map((item) => ({
        ...item,
        deficit: item.target - item.calories,
      }))
    }

    // For weekly view
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const currentDay = new Date().getDay() || 7 // Convert Sunday (0) to 7

    // Initialize data with 0 calories for each day
    const weeklyData = days.map((day, index) => {
      // Calculate a realistic target based on day (higher on weekdays, lower on weekends)
      const isWeekend = index >= 5
      const baseTarget = 300 // Base daily target
      const target = isWeekend ? Math.round(baseTarget * 0.8) : baseTarget // 20% lower on weekends

      return {
        name: day,
        calories: 0,
        target,
      }
    })

    // Get current week workouts
    const now = new Date()
    const dayOfWeek = now.getDay() || 7 // Convert Sunday (0) to 7
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1) // Monday
    startOfWeek.setHours(0, 0, 0, 0)

    // Add calories from completed exercises
    Object.values(completedExercises).forEach((exercise) => {
      const workoutDate = new Date(exercise.completedAt)

      // Check if workout is in current week
      if (workoutDate >= startOfWeek && workoutDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        const dayIndex = workoutDate.getDay() - 1 // Monday is 0
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyData[dayIndex].calories += exercise.caloriesBurned
        }
      }
    })

    // Also add data from user profile if available
    completedWorkouts.forEach((workout) => {
      const workoutDate = new Date(workout.date)

      // Check if workout is in current week
      if (workoutDate >= startOfWeek && workoutDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        const dayIndex = workoutDate.getDay() - 1 // Monday is 0
        if (dayIndex >= 0 && dayIndex < 7) {
          // More accurate calorie calculation
          let caloriesPerMinute = 8 // Base rate

          // Adjust based on difficulty
          if (workout.difficulty === "beginner") caloriesPerMinute = 6
          else if (workout.difficulty === "advanced") caloriesPerMinute = 10

          // Adjust based on muscle groups
          const hasLargeMuscleGroups = (workout.muscleGroups || []).some((group) =>
            ["Lower Body Push", "Lower Body Pull", "Upper Body Pull"].includes(group),
          )
          if (hasLargeMuscleGroups) caloriesPerMinute += 2

          const caloriesBurned = Math.round((workout.duration || 0) * caloriesPerMinute)
          weeklyData[dayIndex].calories += caloriesBurned
        }
      }
    })

    // Calculate deficit/surplus
    return weeklyData.map((item) => ({
      ...item,
      deficit: item.target - item.calories,
    }))
  }

  // Get recent workouts
  const getRecentWorkouts = () => {
    if (!userProfile) return []

    const completedWorkouts = [...(userProfile.completedWorkouts || [])]

    // Sort by date (newest first)
    return completedWorkouts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4) // Get the 4 most recent workouts
      .map((workout) => {
        // Generate a workout name based on muscle groups
        const muscleGroups = workout.muscleGroups || []
        let name = "Workout"

        if (muscleGroups.length === 0) {
          name = "General Workout"
        } else if (muscleGroups.includes("Upper Body Push") && muscleGroups.includes("Upper Body Pull")) {
          name = "Full Upper Body Workout"
        } else if (muscleGroups.includes("Lower Body Push") && muscleGroups.includes("Lower Body Pull")) {
          name = "Full Lower Body Workout"
        } else if (
          muscleGroups.includes("Upper Body Push") ||
          muscleGroups.includes("Upper Body Pull") ||
          muscleGroups.includes("Arms") ||
          muscleGroups.includes("Shoulders")
        ) {
          name = "Upper Body Workout"
        } else if (muscleGroups.includes("Lower Body Push") || muscleGroups.includes("Lower Body Pull")) {
          name = "Lower Body Workout"
        } else if (muscleGroups.includes("Core")) {
          name = "Core Workout"
        } else if (muscleGroups.length > 2) {
          name = "Full Body Workout"
        } else {
          name = `${muscleGroups[0]} Workout`
        }

        return {
          ...workout,
          name,
        }
      })
  }

  // Generate workout recommendations
  const getWorkoutRecommendations = () => {
    if (!userProfile) return []

    const completedWorkouts = userProfile.completedWorkouts || []

    // Analyze workout patterns
    const muscleGroupFrequency: Record<string, number> = {}
    completedWorkouts.forEach((workout) => {
      ;(workout.muscleGroups || []).forEach((group) => {
        muscleGroupFrequency[group] = (muscleGroupFrequency[group] || 0) + 1
      })
    })

    // Find least trained muscle groups
    const muscleGroups = Object.entries(muscleGroupFrequency)
      .sort(([, a], [, b]) => a - b)
      .map(([group]) => group)

    // Generate recommendations
    const recommendations = [
      {
        id: "hiit",
        title: "High-Intensity Interval Training",
        description: "Boost your metabolism with this 20-minute HIIT session",
        icon: <Flame className="h-5 w-5" />,
        color: "bg-red-100 text-red-600",
        duration: "20 min",
        difficulty: "Intermediate",
      },
      {
        id: "strength",
        title: "Strength Training",
        description:
          muscleGroups.length > 0
            ? `Focus on your ${muscleGroups[0]} with this strength workout`
            : "Build muscle with this full-body strength workout",
        icon: <Dumbbell className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-600",
        duration: "45 min",
        difficulty: "Beginner to Advanced",
      },
      {
        id: "yoga",
        title: "Yoga for Flexibility",
        description: "Improve your mobility and reduce stress with this yoga flow",
        icon: <Yoga className="h-5 w-5" />,
        color: "bg-purple-100 text-purple-600",
        duration: "30 min",
        difficulty: "All levels",
      },
    ]

    return recommendations
  }

  const weeklyData = getWeeklyWorkoutData()
  const caloriesData = getCaloriesData()
  const recentWorkouts = getRecentWorkouts()
  const recommendations = getWorkoutRecommendations()

  // Custom tooltip for calories chart
  const CaloriesChartTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-green-600">Calories Burned: {payload[0].value}</p>
          <p className="text-blue-600">Target: {payload[1].value}</p>
          <p className={payload[2].value >= 0 ? "text-red-600" : "text-green-600"}>
            {payload[2].value >= 0 ? "Deficit" : "Surplus"}: {Math.abs(payload[2].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.2)" }}
          className="overflow-hidden"
        >
          <Card className="border-indigo-100 h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-600">Workouts Completed</p>
                  <h3 className="text-2xl font-bold text-indigo-900">{countUpValues.workoutsCompleted}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.2)" }}
          className="overflow-hidden"
        >
          <Card className="border-indigo-100 h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Flame className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-600">Calories Burned</p>
                  <h3 className="text-2xl font-bold text-indigo-900">
                    {countUpValues.caloriesBurned.toLocaleString()}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)" }}
          className="overflow-hidden"
        >
          <Card className="border-indigo-100 h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-600">Total Workout Time</p>
                  <h3 className="text-2xl font-bold text-indigo-900">{formatTime(countUpValues.totalMinutes)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.2)" }}
          className="overflow-hidden"
        >
          <Card className="border-indigo-100 h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-600">Overall Progress</p>
                  <h3 className="text-2xl font-bold text-indigo-900">{countUpValues.progress}%</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Recent Workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-6">
        {/* Weekly Workout Progress Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle className="text-indigo-900">Weekly Workout Progress</CardTitle>
              <CardDescription className="text-indigo-600">
                Your workout duration in minutes for the past week
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    minutes: {
                      label: "Minutes",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="day"
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
                      {weeklyData.map((entry, index) => (
                        <Bar
                          key={`bar-${index}`}
                          dataKey="minutes"
                          fill={hoveredBar === index ? "#818cf8" : "#a5b4fc"}
                          radius={[4, 4, 0, 0]}
                          onMouseEnter={() => setHoveredBar(index)}
                          onMouseLeave={() => setHoveredBar(null)}
                          animationDuration={1500}
                          animationBegin={index * 150}
                        >
                          {/* Custom animation for each bar */}
                          <AnimatePresence>
                            {hoveredBar === index && (
                              <motion.animate
                                attributeName="height"
                                from="0"
                                to={entry.minutes}
                                dur="0.5s"
                                fill="freeze"
                              />
                            )}
                          </AnimatePresence>
                        </Bar>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calories Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-indigo-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-indigo-900">Calories Chart</CardTitle>
                <CardDescription className="text-indigo-600">Calories burned vs. target goals</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-indigo-700">View:</span>
                <Select value={caloriesTimeframe} onValueChange={setCaloriesTimeframe}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Monthly" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Chart Legend:</span> Green bars show calories burned, blue bars show
                  your target goals, and red bars show the deficit (or surplus if negative).
                </p>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caloriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6366f1" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={{ stroke: "#cbd5e1" }}
                    />
                    <YAxis
                      tick={{ fill: "#6366f1" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={{ stroke: "#cbd5e1" }}
                    />
                    <Tooltip content={<CaloriesChartTooltip />} />
                    <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deficit" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Workouts and AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle className="text-indigo-900">Recent Workouts</CardTitle>
              <CardDescription className="text-indigo-600">Your most recent workout sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {recentWorkouts.length === 0 ? (
                  <p className="text-center py-8 text-indigo-500">No workouts completed yet</p>
                ) : (
                  recentWorkouts.map((workout, index) => (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-md">
                          <Calendar className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-indigo-900">{workout.name}</h4>
                          <p className="text-xs text-indigo-500">{new Date(workout.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full"
                      >
                        {workout.duration} min
                      </motion.div>
                    </motion.div>
                  ))
                )}
                <Button variant="outline" className="w-full mt-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  View all workouts
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI-Powered Workout Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle className="text-indigo-900">AI-Powered Workout Recommendations</CardTitle>
              <CardDescription className="text-indigo-600">
                Personalized workout suggestions based on your history and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {recommendations.map((recommendation) => (
                  <motion.div
                    key={recommendation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-lg border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                  >
                    <motion.div
                      className="p-4 cursor-pointer"
                      onClick={() =>
                        setExpandedRecommendation(
                          expandedRecommendation === recommendation.id ? null : recommendation.id,
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-md ${recommendation.color}`}>{recommendation.icon}</div>
                          <div>
                            <h4 className="font-medium text-indigo-900">{recommendation.title}</h4>
                            <p className="text-sm text-indigo-600">{recommendation.description}</p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 text-indigo-400 transition-transform duration-300 ${
                            expandedRecommendation === recommendation.id ? "rotate-90" : ""
                          }`}
                        />
                      </div>

                      <AnimatePresence>
                        {expandedRecommendation === recommendation.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-indigo-100"
                          >
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-indigo-50 p-3 rounded-md">
                                <p className="text-xs text-indigo-500">Duration</p>
                                <p className="font-medium text-indigo-800">{recommendation.duration}</p>
                              </div>
                              <div className="bg-indigo-50 p-3 rounded-md">
                                <p className="text-xs text-indigo-500">Difficulty</p>
                                <p className="font-medium text-indigo-800">{recommendation.difficulty}</p>
                              </div>
                            </div>
                            <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                              Start Workout
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Calendar icon component
function Calendar(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}
