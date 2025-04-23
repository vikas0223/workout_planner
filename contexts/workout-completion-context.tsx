"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

type CompletedExercise = {
  id: string
  exerciseId: string
  workoutId: string
  completedAt: string
  caloriesBurned: number
}

type SavedWorkout = {
  id: string
  name: string
  date: string
  plan: any
}

type FavoriteExercise = {
  id: string
  exerciseId: string
  exerciseName: string
  muscleGroup: string
  equipment: string[]
}

type WorkoutCompletionContextType = {
  completedExercises: Record<string, CompletedExercise>
  savedWorkouts: SavedWorkout[]
  favoriteExercises: FavoriteExercise[]
  markExerciseComplete: (exerciseId: string, workoutId: string, caloriesBurned: number) => Promise<void>
  isExerciseCompleted: (exerciseId: string) => boolean
  getCompletionPercentage: (workoutId: string, totalExercises: number) => number
  getTotalCaloriesBurned: (workoutId: string) => number
  refreshCompletedExercises: () => Promise<void>
  saveWorkoutPlan: (plan: any) => Promise<string | null>
  addExerciseToFavorites: (exercise: any) => Promise<void>
  removeExerciseFromFavorites: (exerciseId: string) => Promise<void>
  isExerciseFavorite: (exerciseId: string) => boolean
  getUserId: () => string | null
  isOfflineMode: boolean
}

const WorkoutCompletionContext = createContext<WorkoutCompletionContextType | undefined>(undefined)

export function WorkoutCompletionProvider({ children }: { children: React.ReactNode }) {
  const [completedExercises, setCompletedExercises] = useState<Record<string, CompletedExercise>>({})
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([])
  const [favoriteExercises, setFavoriteExercises] = useState<FavoriteExercise[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [tablesInitialized, setTablesInitialized] = useState(false)

  // Try to get the Supabase client, which may return a fallback client if env vars are missing
  const supabase = getSupabaseBrowserClient()

  // Initialize database tables if they don't exist
  const initializeTables = async () => {
    if (tablesInitialized) return

    try {
      // Check if tables exist and create them if they don't
      await createTablesIfNotExist()
      setTablesInitialized(true)
    } catch (error) {
      console.error("Error initializing tables:", error)
      setIsOfflineMode(true)
    }
  }

  // Create necessary tables if they don't exist
  const createTablesIfNotExist = async () => {
    try {
      // We'll use RPC to execute SQL to create tables if they don't exist
      // This is a simplified approach - in a production app, you'd use migrations

      // First, check if the users table exists
      const { data: usersTable, error: usersError } = await supabase.from("users").select("id").limit(1).maybeSingle()

      // If we get a "relation does not exist" error, we need to create the tables
      if (usersError && usersError.message.includes('relation "users" does not exist')) {
        console.log("Users table doesn't exist, switching to offline mode")
        setIsOfflineMode(true)
        return
      }

      // Check if saved_workouts table exists
      const { data: savedWorkoutsTable, error: savedWorkoutsError } = await supabase
        .from("saved_workouts")
        .select("id")
        .limit(1)
        .maybeSingle()

      // If we get a "relation does not exist" error for saved_workouts, we'll operate in offline mode
      if (savedWorkoutsError && savedWorkoutsError.message.includes('relation "saved_workouts" does not exist')) {
        console.log("Saved workouts table doesn't exist, switching to offline mode")
        setIsOfflineMode(true)
        return
      }

      // Check if completed_exercises table exists
      const { data: completedExercisesTable, error: completedExercisesError } = await supabase
        .from("completed_exercises")
        .select("id")
        .limit(1)
        .maybeSingle()

      // If we get a "relation does not exist" error for completed_exercises, we'll operate in offline mode
      if (
        completedExercisesError &&
        completedExercisesError.message.includes('relation "completed_exercises" does not exist')
      ) {
        console.log("Completed exercises table doesn't exist, switching to offline mode")
        setIsOfflineMode(true)
        return
      }

      // Check if favorite_exercises table exists
      const { data: favoriteExercisesTable, error: favoriteExercisesError } = await supabase
        .from("favorite_exercises")
        .select("id")
        .limit(1)
        .maybeSingle()

      // If we get a "relation does not exist" error for favorite_exercises, we'll operate in offline mode
      if (
        favoriteExercisesError &&
        favoriteExercisesError.message.includes('relation "favorite_exercises" does not exist')
      ) {
        console.log("Favorite exercises table doesn't exist, switching to offline mode")
        setIsOfflineMode(true)
        return
      }

      // Check if user_stats table exists
      const { data: userStatsTable, error: userStatsError } = await supabase
        .from("user_stats")
        .select("user_id")
        .limit(1)
        .maybeSingle()

      // If we get a "relation does not exist" error for user_stats, we'll operate in offline mode
      if (userStatsError && userStatsError.message.includes('relation "user_stats" does not exist')) {
        console.log("User stats table doesn't exist, switching to offline mode")
        setIsOfflineMode(true)
        return
      }
    } catch (error) {
      console.error("Error checking/creating tables:", error)
      setIsOfflineMode(true)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      // Load completed exercises
      const exercises = localStorage.getItem("completedExercises")
      if (exercises) {
        setCompletedExercises(JSON.parse(exercises))
      }

      // Load saved workouts
      const workouts = localStorage.getItem("savedWorkouts")
      if (workouts) {
        setSavedWorkouts(JSON.parse(workouts))
      }

      // Load favorite exercises
      const favorites = localStorage.getItem("favoriteExercises")
      if (favorites) {
        setFavoriteExercises(JSON.parse(favorites))
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
      // Initialize with empty data if localStorage parsing fails
      setCompletedExercises({})
      setSavedWorkouts([])
      setFavoriteExercises([])
    }
  }

  // Define fetchCompletedExercises with useCallback before it's used in useEffect
  const fetchCompletedExercises = useCallback(
    async (uid: string) => {
      if (!uid || isOfflineMode) return

      try {
        const { data, error } = await supabase.from("completed_exercises").select("*").eq("user_id", uid)

        if (error) {
          // If the table doesn't exist, switch to offline mode
          if (error.message.includes('relation "completed_exercises" does not exist')) {
            console.error("Completed exercises table doesn't exist")
            setIsOfflineMode(true)
            loadFromLocalStorage()
            return
          }
          throw error
        }

        const exercisesMap: Record<string, CompletedExercise> = {}
        data?.forEach((exercise) => {
          // Use exercise_id as the key in our map
          exercisesMap[exercise.exercise_id] = {
            id: exercise.id,
            exerciseId: exercise.exercise_id,
            workoutId: exercise.workout_id,
            completedAt: exercise.completed_at,
            caloriesBurned: exercise.calories_burned || 0,
          }
        })

        setCompletedExercises(exercisesMap)

        // Also store in localStorage as backup
        localStorage.setItem("completedExercises", JSON.stringify(exercisesMap))
      } catch (error) {
        console.error("Error fetching completed exercises:", error)
        setIsOfflineMode(true)

        // Fallback to localStorage
        const exercises = localStorage.getItem("completedExercises")
        if (exercises) {
          try {
            setCompletedExercises(JSON.parse(exercises))
          } catch (parseError) {
            console.error("Error parsing completed exercises from localStorage:", parseError)
            setCompletedExercises({})
          }
        }
      }
    },
    [isOfflineMode, supabase],
  )

  // Define fetchSavedWorkouts with useCallback before it's used in useEffect
  const fetchSavedWorkouts = useCallback(
    async (uid: string) => {
      if (!uid || isOfflineMode) return

      try {
        // First check if the table exists to avoid throwing errors
        try {
          const { data: tableCheck, error: tableError } = await supabase
            .from("saved_workouts")
            .select("id")
            .limit(1)
            .maybeSingle()

          // If the table doesn't exist, switch to offline mode immediately
          if (tableError && tableError.message.includes('relation "saved_workouts" does not exist')) {
            console.log("Saved workouts table doesn't exist, switching to offline mode")
            setIsOfflineMode(true)
            loadFromLocalStorage()
            return
          }
        } catch (tableCheckError) {
          console.error("Error checking saved_workouts table:", tableCheckError)
          setIsOfflineMode(true)
          loadFromLocalStorage()
          return
        }

        // If we get here, the table exists, so we can safely query it
        const { data, error } = await supabase.from("saved_workouts").select("*").eq("user_id", uid)

        if (error) {
          console.error("Error fetching saved workouts:", error)
          setIsOfflineMode(true)
          loadFromLocalStorage()
          return
        }

        if (data) {
          const workouts = data.map((workout) => {
            let parsedWorkoutData

            // Safely parse workout data
            if (typeof workout.workout_data === "string") {
              try {
                parsedWorkoutData = JSON.parse(workout.workout_data)
              } catch (parseError) {
                console.error("Error parsing workout data:", parseError)
                parsedWorkoutData = {} // Fallback to empty object
              }
            } else {
              parsedWorkoutData = workout.workout_data || {}
            }

            return {
              id: workout.id,
              name: workout.name || "Unnamed Workout",
              date: workout.created_at || new Date().toISOString(),
              plan: parsedWorkoutData,
            }
          })

          setSavedWorkouts(workouts)

          // Also store in localStorage as backup
          localStorage.setItem("savedWorkouts", JSON.stringify(workouts))
        }
      } catch (error) {
        console.error("Error fetching saved workouts:", error)
        setIsOfflineMode(true)

        // Fallback to localStorage
        const workouts = localStorage.getItem("savedWorkouts")
        if (workouts) {
          try {
            setSavedWorkouts(JSON.parse(workouts))
          } catch (parseError) {
            console.error("Error parsing saved workouts from localStorage:", parseError)
            setSavedWorkouts([])
          }
        }
      }
    },
    [isOfflineMode, supabase],
  )

  // Define fetchFavoriteExercises with useCallback before it's used in useEffect
  const fetchFavoriteExercises = useCallback(
    async (uid: string) => {
      if (!uid) {
        console.error("Cannot fetch favorite exercises: No user ID provided")
        return
      }

      if (isOfflineMode) {
        console.log("In offline mode, skipping fetch from Supabase")
        return
      }

      try {
        // First check if the table exists to avoid throwing errors
        try {
          const { data: tableCheck, error: tableError } = await supabase
            .from("favorite_exercises")
            .select("id")
            .limit(1)
            .maybeSingle()

          // If the table doesn't exist, switch to offline mode immediately
          if (
            tableError &&
            tableError.message &&
            tableError.message.includes('relation "favorite_exercises" does not exist')
          ) {
            console.log("Favorite exercises table doesn't exist, switching to offline mode")
            setIsOfflineMode(true)
            loadFromLocalStorage()
            return
          }
        } catch (tableCheckError) {
          console.error("Error checking favorite_exercises table:", tableCheckError)
          setIsOfflineMode(true)
          loadFromLocalStorage()
          return
        }

        // If we get here, the table exists, so we can safely query it
        const { data, error } = await supabase.from("favorite_exercises").select("*").eq("user_id", uid)

        if (error) {
          console.error("Error fetching favorite exercises:", error)
          setIsOfflineMode(true)
          loadFromLocalStorage()
          return
        }

        if (data) {
          const favorites = data.map((fav) => {
            let equipmentArray = []

            // Safely parse equipment data
            if (fav.equipment) {
              if (typeof fav.equipment === "string") {
                try {
                  equipmentArray = JSON.parse(fav.equipment)
                } catch (parseError) {
                  console.error("Error parsing equipment data:", parseError)
                  equipmentArray = [] // Fallback to empty array
                }
              } else if (Array.isArray(fav.equipment)) {
                equipmentArray = fav.equipment
              }
            }

            return {
              id: fav.id || `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              exerciseId: fav.exercise_id || "unknown_exercise",
              exerciseName: fav.exercise_name || "Unknown Exercise",
              muscleGroup: fav.muscle_group || "",
              equipment: equipmentArray,
            }
          })

          setFavoriteExercises(favorites)

          // Also store in localStorage as backup
          localStorage.setItem("favoriteExercises", JSON.stringify(favorites))
        }
      } catch (error) {
        console.error("Error fetching favorite exercises:", error)
        setIsOfflineMode(true)

        // Fallback to localStorage
        const favorites = localStorage.getItem("favoriteExercises")
        if (favorites) {
          try {
            setFavoriteExercises(JSON.parse(favorites))
          } catch (parseError) {
            console.error("Error parsing favorite exercises from localStorage:", parseError)
            setFavoriteExercises([])
          }
        }
      }
    },
    [isOfflineMode, supabase],
  )

  // Define refreshCompletedExercises with useCallback before it's used in useEffect
  const refreshCompletedExercises = useCallback(async () => {
    if (userId && !isOfflineMode) {
      await fetchCompletedExercises(userId)
    }
  }, [userId, isOfflineMode, fetchCompletedExercises])

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        // First check if we have a user ID in localStorage
        const storedUserId = localStorage.getItem("workoutAppUserId")

        if (storedUserId) {
          setUserId(storedUserId)

          // Initialize tables if needed
          await initializeTables()

          // If we're in offline mode after table initialization, load from localStorage
          if (isOfflineMode) {
            loadFromLocalStorage()
            return
          }

          // Try to fetch data from Supabase
          try {
            // Wrap each fetch in a try/catch to prevent one failure from stopping others
            try {
              await fetchCompletedExercises(storedUserId)
            } catch (error) {
              console.error("Error fetching completed exercises:", error)
              // Continue with other fetches
            }

            try {
              await fetchSavedWorkouts(storedUserId)
            } catch (error) {
              console.error("Error fetching saved workouts:", error)
              // Continue with other fetches
            }

            try {
              await fetchFavoriteExercises(storedUserId)
            } catch (error) {
              console.error("Error fetching favorite exercises:", error)
              // Continue with other fetches
            }
          } catch (error) {
            console.error("Error fetching data from Supabase:", error)
            setIsOfflineMode(true)

            // Load data from localStorage as fallback
            loadFromLocalStorage()
          }
        } else {
          // Create a new UUID for this user
          const newUserId = crypto.randomUUID()
          localStorage.setItem("workoutAppUserId", newUserId)
          setUserId(newUserId)

          // Initialize tables if needed
          await initializeTables()

          // If we're in offline mode after table initialization, return
          if (isOfflineMode) {
            return
          }

          try {
            // Create user record in database
            await supabase.from("users").insert({
              id: newUserId,
              name: localStorage.getItem("workoutAppUserName") || "Anonymous User",
              email: `user_${newUserId.substring(0, 8)}@example.com`,
            })

            // Initialize user stats
            await supabase.from("user_stats").insert({
              user_id: newUserId,
              total_workouts: 0,
              total_exercises_completed: 0,
              total_calories_burned: 0,
              total_duration: 0,
            })
          } catch (error) {
            console.error("Error creating user in Supabase:", error)
            setIsOfflineMode(true)
          }
        }
      } catch (error) {
        console.error("Error getting user:", error)
        setIsOfflineMode(true)

        // Fallback to local storage only
        loadFromLocalStorage()
      }
    }

    getUserId()

    // Set up real-time subscription for completed exercises if not in offline mode
    let exercisesSubscription: any
    let statsSubscription: any
    let workoutsSubscription: any
    let favoritesSubscription: any

    if (!isOfflineMode) {
      try {
        exercisesSubscription = supabase
          .channel("completed-exercises-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "completed_exercises" }, (payload) => {
            refreshCompletedExercises()
          })
          .subscribe()

        // Set up real-time subscription for user stats
        statsSubscription = supabase
          .channel("user-stats-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "user_stats" }, (payload) => {
            // This will trigger a refresh of the dashboard
            refreshCompletedExercises()
          })
          .subscribe()

        // Set up real-time subscription for saved workouts
        workoutsSubscription = supabase
          .channel("saved-workouts-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "saved_workouts" }, (payload) => {
            if (userId) {
              fetchSavedWorkouts(userId)
            }
          })
          .subscribe()

        // Set up real-time subscription for favorite exercises
        favoritesSubscription = supabase
          .channel("favorite-exercises-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "favorite_exercises" }, (payload) => {
            if (userId) {
              fetchFavoriteExercises(userId)
            }
          })
          .subscribe()
      } catch (error) {
        console.error("Error setting up Supabase subscriptions:", error)
        setIsOfflineMode(true)
      }
    }

    return () => {
      if (!isOfflineMode && exercisesSubscription) {
        try {
          supabase.removeChannel(exercisesSubscription)
          supabase.removeChannel(statsSubscription)
          supabase.removeChannel(workoutsSubscription)
          supabase.removeChannel(favoritesSubscription)
        } catch (error) {
          console.error("Error removing Supabase channels:", error)
        }
      }
    }
  }, [
    isOfflineMode,
    supabase,
    fetchCompletedExercises,
    fetchFavoriteExercises,
    fetchSavedWorkouts,
    refreshCompletedExercises,
  ])

  const markExerciseComplete = useCallback(
    async (exerciseId: string, workoutId: string, caloriesBurned: number) => {
      if (!userId) return

      try {
        // Validate inputs
        if (!exerciseId) throw new Error("Exercise ID is required")
        if (!workoutId) throw new Error("Workout ID is required")
        if (caloriesBurned < 0) throw new Error("Calories burned must be a positive number")

        // Generate a UUID for the database record ID
        const dbId = crypto.randomUUID()

        // Generate a UUID for the workout ID if it's not already a UUID
        let dbWorkoutId = workoutId
        if (!isValidUUID(workoutId)) {
          dbWorkoutId = `workout_${workoutId}`
        }

        // Create the new exercise object
        const newExercise = {
          id: dbId,
          exerciseId,
          workoutId,
          completedAt: new Date().toISOString(),
          caloriesBurned,
        }

        // Update local state first for immediate feedback
        const updatedExercises = {
          ...completedExercises,
          [exerciseId]: newExercise,
        }

        setCompletedExercises(updatedExercises)

        // Also update localStorage
        localStorage.setItem("completedExercises", JSON.stringify(updatedExercises))

        // If we're not in offline mode, try to save to Supabase
        if (!isOfflineMode) {
          // First check if the table exists to avoid throwing errors
          try {
            const { data: tableCheck, error: tableError } = await supabase
              .from("completed_exercises")
              .select("id")
              .limit(1)
              .maybeSingle()

            // If the table doesn't exist, switch to offline mode immediately
            if (
              tableError &&
              tableError.message &&
              tableError.message.includes('relation "completed_exercises" does not exist')
            ) {
              console.log("Completed exercises table doesn't exist, switching to offline mode")
              setIsOfflineMode(true)
              return
            }
          } catch (tableCheckError) {
            console.error("Error checking completed_exercises table:", tableCheckError)
            setIsOfflineMode(true)
            return
          }

          // Insert into completed_exercises
          const { error } = await supabase.from("completed_exercises").insert({
            id: dbId,
            user_id: userId,
            exercise_id: exerciseId, // This is a reference ID, can be a string
            workout_id: dbWorkoutId,
            calories_burned: caloriesBurned,
            completed_at: new Date().toISOString(),
          })

          if (error) {
            // If the table doesn't exist, switch to offline mode
            if (error.message && error.message.includes('relation "completed_exercises" does not exist')) {
              console.error("Completed exercises table doesn't exist")
              setIsOfflineMode(true)
              return
            }
            throw error
          }

          // Update user_stats
          try {
            await supabase.rpc("increment_user_stats", {
              user_id_param: userId,
              calories_param: caloriesBurned,
              exercises_param: 1,
              duration_param: 0, // We'll update duration when the whole workout is completed
            })
          } catch (rpcError) {
            console.error("Error updating user stats:", rpcError)
            // Continue even if this fails
          }

          // Refresh to get latest data
          await refreshCompletedExercises()
        }
      } catch (error) {
        console.error("Error marking exercise as complete:", error)
        setIsOfflineMode(true)

        // Fallback to localStorage only - already done above
        throw error // Re-throw to allow component to handle the error
      }
    },
    [userId, isOfflineMode, completedExercises, supabase, refreshCompletedExercises],
  )

  const saveWorkoutPlan = useCallback(
    async (plan: any) => {
      if (!userId) {
        console.error("Cannot save workout plan: No user ID available")
        return null
      }

      if (!plan) {
        console.error("Cannot save workout plan: No plan data provided")
        throw new Error("No workout plan provided")
      }

      try {
        // Generate a UUID for the workout
        const workoutId = crypto.randomUUID()

        // Validate plan structure with safe fallbacks
        const exercises = Array.isArray(plan.exercises) ? plan.exercises : []
        if (exercises.length === 0) {
          console.warn("Saving workout plan with no exercises")
        }

        // Create a name for the workout based on muscle groups or type
        let workoutName = "Custom Workout"

        // Safely extract muscle groups with multiple fallback checks
        const muscleGroups = Array.isArray(plan.muscleGroups) ? [...plan.muscleGroups] : []

        // Determine workout name based on muscle groups
        if (muscleGroups.length > 0) {
          if (muscleGroups.length === 1) {
            workoutName = `${muscleGroups[0]} Workout`
          } else if (
            muscleGroups.some((group) => group === "Upper Body Push") &&
            muscleGroups.some((group) => group === "Upper Body Pull")
          ) {
            workoutName = "Upper Body Workout"
          } else if (
            muscleGroups.some((group) => group === "Lower Body Push") &&
            muscleGroups.some((group) => group === "Lower Body Pull")
          ) {
            workoutName = "Lower Body Workout"
          } else if (muscleGroups.length > 2) {
            workoutName = "Full Body Workout"
          }
        }

        // Add goal to workout name if available
        if (plan.goal && typeof plan.goal === "string") {
          workoutName = `${workoutName} (${plan.goal.charAt(0).toUpperCase() + plan.goal.slice(1)})`
        }

        // Create a sanitized version of the plan to ensure it's serializable
        const sanitizedPlan = {
          ...plan,
          exercises: exercises.map((exercise) => ({
            name: exercise?.name || "Unnamed Exercise",
            sets: exercise?.sets || null,
            reps: exercise?.reps || null,
            rest: exercise?.rest || null,
            duration: exercise?.duration || null,
            intensity: exercise?.intensity || null,
            muscleGroup: exercise?.muscleGroup || null,
            equipment: Array.isArray(exercise?.equipment) ? exercise.equipment : [],
            instructions: exercise?.instructions || null,
          })),
          muscleGroups: muscleGroups,
          difficulty: plan.difficulty || "intermediate",
          duration: plan.duration || 30,
          gender: plan.gender || null,
          goal: plan.goal || null,
        }

        // Create the new workout object
        const newWorkout = {
          id: workoutId,
          name: workoutName,
          date: new Date().toISOString(),
          plan: sanitizedPlan,
        }

        // Update local state first
        const updatedWorkouts = [...savedWorkouts, newWorkout]
        setSavedWorkouts(updatedWorkouts)

        // Also update localStorage
        localStorage.setItem("savedWorkouts", JSON.stringify(updatedWorkouts))

        // If we're not in offline mode, try to save to Supabase
        if (!isOfflineMode) {
          // First check if the table exists to avoid throwing errors
          try {
            const { data: tableCheck, error: tableError } = await supabase
              .from("saved_workouts")
              .select("id")
              .limit(1)
              .maybeSingle()

            // If the table doesn't exist, switch to offline mode immediately
            if (
              tableError &&
              tableError.message &&
              tableError.message.includes('relation "saved_workouts" does not exist')
            ) {
              console.log("Saved workouts table doesn't exist, switching to offline mode")
              setIsOfflineMode(true)
              return workoutId
            }
          } catch (tableCheckError) {
            console.error("Error checking saved_workouts table:", tableCheckError)
            setIsOfflineMode(true)
            return workoutId
          }

          // Prepare workout data for database
          const workoutData = JSON.stringify(sanitizedPlan)

          // Insert into saved_workouts
          const { error } = await supabase.from("saved_workouts").insert({
            id: workoutId,
            user_id: userId,
            name: workoutName,
            workout_data: workoutData,
            created_at: new Date().toISOString(),
          })

          if (error) {
            // If the table doesn't exist, switch to offline mode
            if (error.message && error.message.includes('relation "saved_workouts" does not exist')) {
              console.error("Saved workouts table doesn't exist")
              setIsOfflineMode(true)
              return workoutId
            }
            throw error
          }
        }

        console.log(`Workout plan saved successfully with ID: ${workoutId}`)
        return workoutId
      } catch (error) {
        console.error("Error saving workout plan:", error)
        setIsOfflineMode(true)

        // Return the ID anyway since we've saved it locally
        const lastSavedWorkout = savedWorkouts.length > 0 ? savedWorkouts[savedWorkouts.length - 1] : null
        if (lastSavedWorkout) {
          return lastSavedWorkout.id
        }

        throw error // Re-throw to allow component to handle the error
      }
    },
    [userId, isOfflineMode, savedWorkouts, supabase],
  )

  const addExerciseToFavorites = useCallback(
    async (exercise: any) => {
      if (!userId) return
      if (!exercise || !exercise.name) throw new Error("Invalid exercise data")

      try {
        // Generate a UUID for the favorite
        const favoriteId = crypto.randomUUID()

        // Create a unique exercise ID
        const exerciseId = exercise.id || `${exercise.name.replace(/\s+/g, "_").toLowerCase()}`

        // Ensure equipment is properly formatted
        const equipment = Array.isArray(exercise.equipment) ? exercise.equipment : []

        // Create the new favorite object
        const newFavorite = {
          id: favoriteId,
          exerciseId,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup || "",
          equipment,
        }

        // Check if exercise is already in favorites
        const isAlreadyFavorite = favoriteExercises.some((fav) => fav.exerciseId === exerciseId)
        if (isAlreadyFavorite) {
          console.log("Exercise already in favorites")
          return
        }

        // Update local state first
        const updatedFavorites = [...favoriteExercises, newFavorite]
        setFavoriteExercises(updatedFavorites)

        // Also update localStorage
        localStorage.setItem("favoriteExercises", JSON.stringify(updatedFavorites))

        // If we're not in offline mode, try to save to Supabase
        if (!isOfflineMode) {
          // First check if the table exists to avoid throwing errors
          try {
            const { data: tableCheck, error: tableError } = await supabase
              .from("favorite_exercises")
              .select("id")
              .limit(1)
              .maybeSingle()

            // If the table doesn't exist, switch to offline mode immediately
            if (tableError && tableError.message.includes('relation "favorite_exercises" does not exist')) {
              console.log("Favorite exercises table doesn't exist, switching to offline mode")
              setIsOfflineMode(true)
              return
            }
          } catch (tableCheckError) {
            console.error("Error checking favorite_exercises table:", tableCheckError)
            setIsOfflineMode(true)
            return
          }

          // Ensure equipment is properly formatted as a JSON string
          const equipmentJson = JSON.stringify(equipment)

          // Insert into favorite_exercises
          const { error } = await supabase.from("favorite_exercises").insert({
            id: favoriteId,
            user_id: userId,
            exercise_id: exerciseId,
            exercise_name: exercise.name,
            muscle_group: exercise.muscleGroup || "",
            equipment: equipmentJson,
          })

          if (error) {
            // If the table doesn't exist, switch to offline mode
            if (error.message.includes('relation "favorite_exercises" does not exist')) {
              console.error("Favorite exercises table doesn't exist")
              setIsOfflineMode(true)
              return
            }
            throw error
          }
        }
      } catch (error) {
        console.error("Error adding exercise to favorites:", error)
        setIsOfflineMode(true)

        // Fallback already handled above
        throw error // Re-throw to allow component to handle the error
      }
    },
    [userId, isOfflineMode, favoriteExercises, supabase],
  )

  const removeExerciseFromFavorites = useCallback(
    async (exerciseId: string) => {
      if (!userId) return
      if (!exerciseId) throw new Error("Exercise ID is required")

      try {
        // Check if exercise exists in favorites
        const exerciseExists = favoriteExercises.some((fav) => fav.exerciseId === exerciseId)
        if (!exerciseExists) {
          console.log("Exercise not found in favorites")
          return
        }

        // Update local state first
        const updatedFavorites = favoriteExercises.filter((fav) => fav.exerciseId !== exerciseId)
        setFavoriteExercises(updatedFavorites)

        // Also update localStorage
        localStorage.setItem("favoriteExercises", JSON.stringify(updatedFavorites))

        // If we're not in offline mode, try to delete from Supabase
        if (!isOfflineMode) {
          // First check if the table exists to avoid throwing errors
          try {
            const { data: tableCheck, error: tableError } = await supabase
              .from("favorite_exercises")
              .select("id")
              .limit(1)
              .maybeSingle()

            // If the table doesn't exist, switch to offline mode immediately
            if (tableError && tableError.message.includes('relation "favorite_exercises" does not exist')) {
              console.log("Favorite exercises table doesn't exist, switching to offline mode")
              setIsOfflineMode(true)
              return
            }
          } catch (tableCheckError) {
            console.error("Error checking favorite_exercises table:", tableCheckError)
            setIsOfflineMode(true)
            return
          }

          // Delete from favorite_exercises
          const { error } = await supabase
            .from("favorite_exercises")
            .delete()
            .eq("user_id", userId)
            .eq("exercise_id", exerciseId)

          if (error) {
            // If the table doesn't exist, switch to offline mode
            if (error.message.includes('relation "favorite_exercises" does not exist')) {
              console.error("Favorite exercises table doesn't exist")
              setIsOfflineMode(true)
              return
            }
            throw error
          }
        }
      } catch (error) {
        console.error("Error removing exercise from favorites:", error)
        setIsOfflineMode(true)

        // Fallback already handled above
        throw error // Re-throw to allow component to handle the error
      }
    },
    [userId, isOfflineMode, favoriteExercises, supabase],
  )

  const isExerciseFavorite = (exerciseId: string) => {
    if (!exerciseId) {
      console.warn("Cannot check favorite status: No exercise ID provided")
      return false
    }

    // Make sure favoriteExercises is an array before calling .some()
    if (!Array.isArray(favoriteExercises)) {
      console.error("favoriteExercises is not an array:", favoriteExercises)
      return false
    }

    return favoriteExercises.some((fav) => fav.exerciseId === exerciseId)
  }

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (str: string) => {
    if (!str) return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  const isExerciseCompleted = (exerciseId: string) => {
    if (!exerciseId) return false
    return !!completedExercises[exerciseId]
  }

  const getCompletionPercentage = (workoutId: string, totalExercises: number) => {
    if (!workoutId || totalExercises === 0) return 0

    const completedCount = Object.values(completedExercises).filter((ex) => ex.workoutId === workoutId).length

    return Math.round((completedCount / totalExercises) * 100)
  }

  const getTotalCaloriesBurned = (workoutId: string) => {
    if (!workoutId) return 0

    return Object.values(completedExercises)
      .filter((ex) => ex.workoutId === workoutId)
      .reduce((total, ex) => total + (ex.caloriesBurned || 0), 0)
  }

  const getUserId = () => userId

  return (
    <WorkoutCompletionContext.Provider
      value={{
        completedExercises,
        savedWorkouts,
        favoriteExercises,
        markExerciseComplete,
        isExerciseCompleted,
        getCompletionPercentage,
        getTotalCaloriesBurned,
        refreshCompletedExercises,
        saveWorkoutPlan,
        addExerciseToFavorites,
        removeExerciseFromFavorites,
        isExerciseFavorite,
        getUserId,
        isOfflineMode,
      }}
    >
      {children}
    </WorkoutCompletionContext.Provider>
  )
}

export function useWorkoutCompletion() {
  const context = useContext(WorkoutCompletionContext)
  if (context === undefined) {
    throw new Error("useWorkoutCompletion must be used within a WorkoutCompletionProvider")
  }
  return context
}
