"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Activity, Clock, TrendingUp, Dumbbell, Flame, SpaceIcon as Yoga } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import { useWorkoutCompletion } from "@/contexts/workout-completion-context"

export default function EnhancedDashboardWithRealtime() {
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
  const [userStats, setUserStats] = useState(null)
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [caloriesData, setCaloriesData] = useState([])
  const { refreshCompletedExercises } = useWorkoutCompletion()
  const supabase = getSupabaseBrowserClient()

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
    loadUserData()

    // Set up real-time subscription for completed exercises
    const exercisesSubscription = supabase
      .channel("completed-exercises-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "completed_exercises" }, () => {
        refreshCompletedExercises()
        loadUserData()
      })
      .subscribe()

    // Set up real-time subscription for user stats
    const statsSubscription = supabase
      .channel("user-stats-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "user_stats" }, () => {
        loadUserData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(exercisesSubscription)
      supabase.removeChannel(statsSubscription)
    }
  }, [])

  const loadUserData = async () => {
    try {
      // Get user ID (either authenticated or from localStorage)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const userId = user?.id || localStorage.getItem("workoutAppUserId")

      if (!userId) return

      // Load user stats
      const { data: statsData } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

      if (statsData) {
        setUserStats(statsData)

        // Animate count up
        animateCountUp(statsData)
      }

      // Load recent workouts
      const { data: workoutsData } = await supabase
        .from("workout_sessions")
        .select(`
          id,
          started_at,
          completed_at,
          duration,
          calories_burned,
          workout_plans(name)
        `)
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(4)

      if (workoutsData) {
        setRecentWorkouts(workoutsData)
      }

      // Generate weekly workout data
      generateWeeklyWorkoutData(userId)

      // Generate calories data
      generateCaloriesData(userId)
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const animateCountUp = (statsData) => {
    const duration = 1500 // Animation duration in ms
    const steps = 30 // Number of steps in the animation
    const interval = duration / steps

    const targetValues = {
      workoutsCompleted: statsData.total_workouts || 0,
      caloriesBurned: statsData.total_calories_burned || 0,
      totalMinutes: Math.round((statsData.total_duration || 0) / 60), // Convert seconds to minutes
      progress: Math.min(100, Math.round(((statsData.total_workouts || 0) / 12) * 100)), // Example target of 12 workouts
    }

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps

      setCountUpValues({
        workoutsCompleted: Math.round(progress * targetValues.workoutsCompleted),
        caloriesBurned: Math.round(progress * targetValues.caloriesBurned),
        totalMinutes: Math.round(progress * targetValues.totalMinutes),
        progress: Math.round(progress * targetValues.progress),
      })

      if (step >= steps) clearInterval(timer)
    }, interval)
  }

  // Format minutes to hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Generate weekly workout data from completed exercises
  const generateWeeklyWorkoutData = async (userId) => {
    try {
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

      // Get completed exercises for the current week
      const startDate = startOfWeek.toISOString()
      const endDate = new Date(startOfWeek)
      endDate.setDate(startOfWeek.getDate() + 7)
      endDate.setHours(23, 59, 59, 999)

      const { data: completedExercises } = await supabase
        .from("completed_exercises")
        .select("*")
        .eq("user_id", userId)
        .gte("completed_at", startDate)
        .lt("completed_at", endDate.toISOString())

      if (completedExercises) {
        // Group exercises by day and calculate total minutes
        completedExercises.forEach((exercise) => {
          const exerciseDate = new Date(exercise.completed_at)
          const dateStr = exerciseDate.toISOString().split("T")[0]
          const weekDataIndex = weekData.findIndex((d) => d.date === dateStr)

          if (weekDataIndex !== -1) {
            // Estimate minutes based on exercise (assuming 2 minutes per exercise)
            weekData[weekDataIndex].minutes += 2
          }
        })
      }

      setWeeklyData(weekData)
    } catch (error) {
      console.error("Error generating weekly workout data:", error)
    }
  }

  // Generate calories data
  const generateCaloriesData = async (userId) => {
    try {
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

        // Get calories burned by month
        const currentYear = new Date().getFullYear()
        const startOfYear = new Date(currentYear, 0, 1).toISOString()
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString()

        const { data: completedExercises } = await supabase
          .from("completed_exercises")
          .select("completed_at, calories_burned")
          .eq("user_id", userId)
          .gte("completed_at", startOfYear)
          .lte("completed_at", endOfYear)

        if (completedExercises) {
          // Group calories by month
          completedExercises.forEach((exercise) => {
            const exerciseDate = new Date(exercise.completed_at)
            const monthIndex = exerciseDate.getMonth()
            monthlyData[monthIndex].calories += exercise.calories_burned || 0
          })
        }

        // Calculate deficit/surplus
        const finalData = monthlyData.map((item) => ({
          ...item,
          deficit: item.target - item.calories,
        }))

        setCaloriesData(finalData)
      } else {
        // Weekly view
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

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

        // Get the current date and calculate the start of the week (Monday)
        const now = new Date()
        const dayOfWeek = now.getDay() || 7 // Convert Sunday (0) to 7
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - dayOfWeek + 1) // Monday
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)
        endOfWeek.setHours(0, 0, 0, 0)

        // Get calories burned for the current week
        const { data: completedExercises } = await supabase
          .from("completed_exercises")
          .select("completed_at, calories_burned")
          .eq("user_id", userId)
          .gte("completed_at", startOfWeek.toISOString())
          .lt("completed_at", endOfWeek.toISOString())

        if (completedExercises) {
          // Group calories by day
          completedExercises.forEach((exercise) => {
            const exerciseDate = new Date(exercise.completed_at)
            const dayIndex = exerciseDate.getDay() - 1 // Monday is 0
            if (dayIndex >= 0 && dayIndex < 7) {
              weeklyData[dayIndex].calories += exercise.calories_burned || 0
            }
          })
        }

        // Calculate deficit/surplus
        const finalData = weeklyData.map((item) => ({
          ...item,
          deficit: item.target - item.calories,
        }))

        setCaloriesData(finalData)
      }
    } catch (error) {
      console.error("Error generating calories data:", error)
    }
  }

  // Generate workout recommendations
  const getWorkoutRecommendations = () => {
    // This could be enhanced with real recommendations based on user history
    return [
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
        description: "Build muscle with this full-body strength workout",
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
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.2)" }}
          className="overflow-hidden"
        >
          <Card className="border-indigo-100 h-full">
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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
            <CardContent className="p-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Workout Progress Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle className="text-indigo-900">Weekly Workout Progress</CardTitle>
              <CardDescription className="text-indigo-600">
                Your workout duration in minutes for the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        />
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
                <CardDescription className="text-indigo-600">
                  <span className="block mt-1 text-sm font-medium">
                    Each bar shows calories burned vs. target goals
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
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
            <CardContent>
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
                    <Bar dataKey="calories" name="Calories Burned" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target Calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deficit" name="Deficit/Surplus" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-indigo-700">Calories Burned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-indigo-700">Target Calories</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-indigo-700">Deficit (negative is surplus)</span>
                </div>
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
            <CardContent>
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
                          <h4 className="font-medium text-indigo-900">{workout.workout_plans?.name || "Workout"}</h4>
                          <p className="text-xs text-indigo-500">
                            {new Date(workout.completed_at || workout.started_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full"
                      >
                        {workout.duration ? `${Math.round(workout.duration / 60)} min` : "In progress"}
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
            <CardContent>
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
