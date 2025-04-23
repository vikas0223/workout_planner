"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  UserIcon as Male,
  UserIcon as Female,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Dumbbell,
  Activity,
  Heart,
  SpaceIcon as Yoga,
  Flame,
  User,
  Home,
} from "lucide-react"
import { exerciseDatabase } from "@/lib/exercise-database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import SuccessToast from "@/components/success-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createUserProfile, addWorkoutRating, addCompletedWorkout, type UserProfile } from "@/lib/recommendation-engine"
import LoadingAnimation from "@/components/loading-animation"
import { FavoritesProvider } from "@/components/favorites-context"
import { WorkoutCompletionProvider } from "@/contexts/workout-completion-context"
import FavoritesView from "@/components/favorites-view"
import { analyzeDifficultyAdjustment } from "@/lib/difficulty_adjuster"
import { useRouter } from "next/navigation"
import EnhancedMuscleGroupDropdown from "@/components/enhanced-muscle-group-dropdown"
import SimilarWorkouts from "@/components/similar-workouts"
import WorkoutPlanWithTracking from "@/components/workout-plan-with-tracking"

export default function WorkoutPlanner() {
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    weight: "",
    duration: 30,
    equipment: [],
    difficulty: "intermediate",
    muscleGroups: [],
    goal: "",
  })

  // Start with name input (-2)
  const [step, setStep] = useState(-2)
  const [workoutPlan, setWorkoutPlan] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [satisfaction, setSatisfaction] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState({})
  const [savedPlans, setSavedPlans] = useState([])
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [showSavedPlans, setShowSavedPlans] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showMuscleConfirmation, setShowMuscleConfirmation] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [isReturningUser, setIsReturningUser] = useState(false)

  const router = useRouter()

  // Load saved plans and check for returning user
  useEffect(() => {
    const savedPlansFromStorage = localStorage.getItem("savedWorkoutPlans")
    if (savedPlansFromStorage) {
      setSavedPlans(JSON.parse(savedPlansFromStorage))
    }

    // Load user profile if it exists
    const savedUserProfile = localStorage.getItem("userProfile")
    if (savedUserProfile) {
      const profile = JSON.parse(savedUserProfile)
      setUserProfile(profile)

      // Pre-fill name for returning users
      if (profile.name) {
        setFormData((prevData) => ({
          ...prevData,
          name: profile.name,
        }))
      }
    }

    // Check for returning users in localStorage
    const returningUsers = localStorage.getItem("returningUsers")
    if (returningUsers) {
      setIsReturningUser(true)
    }
  }, [])

  const equipmentOptions = [
    "Barbells",
    "Dumbbells",
    "Bodyweight",
    "Machine",
    "Kettlebells",
    "Cables",
    "Bands",
    "Medicine Ball",
    "Resistance Bands",
    "TRX",
    "Foam Roller",
    "Yoga Mat",
  ]

  // Mapping of muscle groups to their corresponding body parts
  const muscleGroupMapping = {
    "Upper Body Push": ["chest", "frontShoulders"],
    "Upper Body Pull": ["upperBack", "lats"],
    "Lower Body Push": ["quads", "calves"],
    "Lower Body Pull": ["hamstrings", "glutes"],
    Core: ["abs", "obliques", "lowerBack"],
    Arms: ["biceps", "triceps", "forearms"],
    Shoulders: ["frontShoulders", "rearShoulders"],
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Special handling for age field
    if (name === "age") {
      const age = Number.parseInt(value)
      if (value && (isNaN(age) || age < 16 || age > 100)) {
        setErrors({
          ...errors,
          age: "Age must be between 16 and 100 years",
        })
      } else {
        // Clear error if valid
        if (errors.age) {
          setErrors({
            ...errors,
            age: null,
          })
        }
      }
    } else {
      // Clear error for other fields
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: null,
        })
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleGoalSelect = (goal) => {
    setFormData({
      ...formData,
      goal,
    })
    setStep(3) // Move to equipment selection after goal selection
  }

  const handleNameSubmit = () => {
    if (!formData.name.trim()) {
      setErrors({
        ...errors,
        name: "Please enter your name",
      })
      return
    }

    // Check if this is a returning user
    const returningUsers = localStorage.getItem("returningUsers")
      ? JSON.parse(localStorage.getItem("returningUsers"))
      : []

    if (returningUsers.includes(formData.name)) {
      // If returning user, mark as returning
      setIsReturningUser(true)

      // Add user to localStorage if not already there
      if (!returningUsers.includes(formData.name)) {
        localStorage.setItem("returningUsers", JSON.stringify([...returningUsers, formData.name]))
      }

      // Continue with normal flow - go to gender selection
      setStep(0)
    } else {
      // Add user to returning users list
      localStorage.setItem("returningUsers", JSON.stringify([...returningUsers, formData.name]))

      // Continue with normal flow - go to gender selection
      setStep(0)
    }
  }

  const handleGenderSelect = (gender) => {
    setFormData({
      ...formData,
      gender,
    })
    setStep(1) // Go to basic info after gender selection
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  const handleSliderChange = (value) => {
    setFormData({
      ...formData,
      duration: value[0],
    })
  }

  const handleCheckboxChange = (name, value, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        [name]: [...formData[name], value],
      })
    } else {
      setFormData({
        ...formData,
        [name]: formData[name].filter((item) => item !== value),
      })
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  const handleMuscleGroupSelect = (group) => {
    if (group === "All") {
      // If All is selected, include all muscle groups
      setFormData({
        ...formData,
        muscleGroups: [
          "Upper Body Push",
          "Upper Body Pull",
          "Lower Body Push",
          "Lower Body Pull",
          "Core",
          "Arms",
          "Shoulders",
        ],
      })
    } else if (formData.muscleGroups.includes(group)) {
      // If the group is already selected, remove it
      const newMuscleGroups = formData.muscleGroups.filter((g) => g !== group)
      setFormData({
        ...formData,
        muscleGroups: newMuscleGroups,
      })
    } else {
      // Add the group to the selection
      setFormData({
        ...formData,
        muscleGroups: [...formData.muscleGroups, group],
      })
    }

    // Clear error for muscleGroups
    if (errors.muscleGroups) {
      setErrors({
        ...errors,
        muscleGroups: null,
      })
    }
  }

  const handleBodyPartSelect = (bodyPart) => {
    // Find which muscle group this body part belongs to
    let targetGroup = null
    for (const [group, parts] of Object.entries(muscleGroupMapping)) {
      if (parts.includes(bodyPart)) {
        targetGroup = group
        break
      }
    }

    if (targetGroup) {
      handleMuscleGroupSelect(targetGroup)
    }
  }

  const handleAllEquipment = (checked) => {
    if (checked) {
      // Select all equipment options
      setFormData({
        ...formData,
        equipment: equipmentOptions.map((eq) => eq.toLowerCase()),
      })
    } else {
      // Deselect all
      setFormData({
        ...formData,
        equipment: [],
      })
    }
  }

  const validateStep = () => {
    const newErrors = {}

    switch (step) {
      case -1: // Name input
        if (!formData.name.trim()) newErrors.name = "Please enter your name"
        break
      case 1: // Basic info
        if (!formData.age) {
          newErrors.age = "Age is required"
        } else {
          const age = Number.parseInt(formData.age)
          if (isNaN(age) || age < 16 || age > 100) {
            newErrors.age = "Age must be between 16 and 100 years"
          }
        }
        if (!formData.weight) newErrors.weight = "Weight is required"
        break
      case 2: // Goal selection (now third step)
        if (!formData.goal) newErrors.goal = "Please select a fitness goal"
        break
      case 3: // Equipment
        if (formData.equipment.length === 0) newErrors.equipment = "Please select at least one equipment option"
        break
      case 4: // Muscle groups
        if (formData.muscleGroups.length === 0) newErrors.muscleGroups = "Please select at least one muscle group"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const adjustDifficultyBasedOnHistory = () => {
    if (userProfile) {
      const adjustment = analyzeDifficultyAdjustment(userProfile)

      // Only update if different from current
      if (adjustment.difficulty !== formData.difficulty) {
        setFormData({
          ...formData,
          difficulty: adjustment.difficulty,
        })

        // Alert user about the adjustment
        alert(`Difficulty adjusted to ${adjustment.difficulty}. ${adjustment.reason}`)
      }
    }
  }

  const nextStep = () => {
    if (validateStep()) {
      // If we're on the muscle group selection step, show confirmation dialog
      if (step === 4) {
        setShowMuscleConfirmation(true)
      } else {
        setStep(step + 1)
      }
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const confirmMuscleGroups = () => {
    setShowMuscleConfirmation(false)
    generateWorkoutPlan() // Generate workout immediately after confirming muscle groups
  }

  const generateWorkoutPlan = () => {
    if (!validateStep()) return

    // First adjust difficulty based on user history
    adjustDifficultyBasedOnHistory()

    setIsGenerating(true)

    // Simulate API call or complex calculation
    setTimeout(() => {
      const exercises = generateExercises(formData)
      setWorkoutPlan(exercises)
      setIsGenerating(false)
      setStep(5)
      setShowSuccessToast(true)

      // Scroll to top when showing results
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 1500) // Simulate 1.5 second delay for loading animation
  }

  const submitFeedback = () => {
    if (!workoutPlan) return

    // Update user profile with rating based on satisfaction
    if (userProfile) {
      let rating = 3 // Default neutral rating

      if (satisfaction === "very-satisfied") rating = 5
      else if (satisfaction === "satisfied") rating = 4
      else if (satisfaction === "unsatisfied") rating = 2

      const updatedProfile = addWorkoutRating(
        userProfile,
        `current_${Date.now()}`, // Generate a temporary ID for the current workout
        rating,
        feedback,
      )

      setUserProfile(updatedProfile)
      localStorage.setItem("userProfile", JSON.stringify(updatedProfile))
    }

    if (satisfaction === "unsatisfied") {
      setIsGenerating(true)

      // Simulate API call or complex calculation
      setTimeout(() => {
        // Regenerate a new plan based on feedback
        const newExercises = regenerateBasedOnFeedback(formData, feedback)
        setWorkoutPlan(newExercises)
        setIsGenerating(false)
        setStep(5)

        // Scroll to top when showing results
        window.scrollTo({ top: 0, behavior: "smooth" })
      }, 1500) // Simulate 1.5 second delay for loading animation
    } else {
      // Thank the user for their feedback
      setStep(7)
    }
  }

  const saveWorkoutPlan = () => {
    if (!workoutPlan) return

    const planToSave = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      plan: workoutPlan,
      formData: formData,
    }

    const updatedSavedPlans = [...savedPlans, planToSave]
    setSavedPlans(updatedSavedPlans)

    // Save to localStorage
    localStorage.setItem("savedWorkoutPlans", JSON.stringify(updatedSavedPlans))

    // Update user profile with completed workout and rating
    if (userProfile) {
      // Add completed workout
      const completedWorkout = {
        id: `workout_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        workoutPlanId: planToSave.id,
        duration: workoutPlan.duration,
        muscleGroups: workoutPlan.muscleGroups,
        difficulty: workoutPlan.difficulty,
      }

      const updatedProfile = addCompletedWorkout(userProfile, completedWorkout)

      // Add a default positive rating (4 out of 5)
      const profileWithRating = addWorkoutRating(updatedProfile, planToSave.id, 4)

      setUserProfile(profileWithRating)
      localStorage.setItem("userProfile", JSON.stringify(profileWithRating))
    } else {
      // Create a new user profile if none exists
      const newProfile = createUserProfile(formData)

      // Add completed workout and rating
      const completedWorkout = {
        id: `workout_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        workoutPlanId: planToSave.id,
        duration: workoutPlan.duration,
        muscleGroups: workoutPlan.muscleGroups,
        difficulty: workoutPlan.difficulty,
      }

      const profileWithWorkout = addCompletedWorkout(newProfile, completedWorkout)
      const profileWithRating = addWorkoutRating(profileWithWorkout, planToSave.id, 4)

      setUserProfile(profileWithRating)
      localStorage.setItem("userProfile", JSON.stringify(profileWithRating))
    }

    // Show confirmation
    alert("Workout plan saved successfully!")
  }

  // Add this function to handle adding a workout to favorites
  const addToFavorites = (workoutPlan) => {
    if (!workoutPlan) return

    const planToSave = {
      id: `fav_${Date.now().toString()}`,
      date: new Date().toLocaleDateString(),
      plan: workoutPlan,
      formData: formData,
    }

    const updatedSavedPlans = [...savedPlans, planToSave]
    setSavedPlans(updatedSavedPlans)

    // Save to localStorage
    localStorage.setItem("savedWorkoutPlans", JSON.stringify(updatedSavedPlans))

    // Show confirmation
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const deleteSavedPlan = (id) => {
    const updatedSavedPlans = savedPlans.filter((plan) => plan.id !== id)
    setSavedPlans(updatedSavedPlans)

    // Update localStorage
    localStorage.setItem("savedWorkoutPlans", JSON.stringify(updatedSavedPlans))
  }

  const loadSavedPlan = (savedPlan) => {
    setWorkoutPlan(savedPlan.plan)
    setFormData(savedPlan.formData)
    setShowSavedPlans(false)
    setStep(5)
  }

  const showExerciseGuidance = (exercise) => {
    setSelectedExercise(exercise)
  }

  const generateExercises = (data) => {
    // Get exercises from our expanded database
    let allExercises = []
    const { equipment, muscleGroups, gender, duration, difficulty, goal } = data

    // First, try to get exercises specific to the selected goal
    if (goal && exerciseDatabase[goal]) {
      // Get exercises for the specific goal
      Object.values(exerciseDatabase[goal]).forEach((typeExercises) => {
        allExercises = [...allExercises, ...typeExercises]
      })
    } else {
      // If no specific goal or goal not found, collect all exercises
      Object.values(exerciseDatabase).forEach((goalExercises) => {
        Object.values(goalExercises).forEach((typeExercises) => {
          allExercises = [...allExercises, ...typeExercises]
        })
      })
    }

    // Filter by selected muscle groups
    let exercises = allExercises.filter((ex) => {
      return ex.muscleGroup && muscleGroups.includes(ex.muscleGroup)
    })

    // Then, filter by available equipment
    if (equipment.length > 0) {
      exercises = exercises.filter((ex) => {
        // If the exercise requires equipment, check if the user has it
        if (ex.equipment && ex.equipment.length > 0) {
          return ex.equipment.some((eq) => equipment.includes(eq.toLowerCase()))
        }
        return false // Only include exercises that use the selected equipment
      })
    }

    // Ensure we have exercises for each selected muscle group
    const exercisesByMuscleGroup = {}
    muscleGroups.forEach((group) => {
      exercisesByMuscleGroup[group] = []
    })

    // Categorize filtered exercises by muscle group
    exercises.forEach((ex) => {
      if (ex.muscleGroup && muscleGroups.includes(ex.muscleGroup)) {
        exercisesByMuscleGroup[ex.muscleGroup].push(ex)
      }
    })

    // Add additional exercises for muscle groups with insufficient exercises
    muscleGroups.forEach((group) => {
      if (exercisesByMuscleGroup[group].length < 2) {
        // Find additional exercises for this muscle group that match equipment
        const additionalExercises = allExercises.filter(
          (ex) =>
            ex.muscleGroup === group &&
            ex.equipment &&
            ex.equipment.some((eq) => equipment.includes(eq.toLowerCase())) &&
            !exercisesByMuscleGroup[group].some((e) => e.name === ex.name),
        )

        // If still not enough, add some generic dumbbell exercises for this muscle group
        if (exercisesByMuscleGroup[group].length + additionalExercises.length < 2 && equipment.includes("dumbbells")) {
          const dumbbellExercises = {
            "Upper Body Push": [
              {
                name: "Dumbbell Bench Press",
                sets: 3,
                reps: "8-12",
                rest: "90 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Lie on a bench with a dumbbell in each hand at chest level. Press the weights up until your arms are fully extended, then lower them back to the starting position.",
              },
              {
                name: "Incline Dumbbell Press",
                sets: 3,
                reps: "8-12",
                rest: "90 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Lie on an incline bench with a dumbbell in each hand at chest level. Press the weights up until your arms are fully extended, then lower them back to the starting position.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "Dumbbell Rows",
                sets: 3,
                reps: "10-12",
                rest: "90 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Bend at the hips with a slight knee bend, holding a dumbbell in one hand. Pull the dumbbell up to your hip, keeping your elbow close to your body, then lower it with control.",
              },
              {
                name: "Dumbbell Pullovers",
                sets: 3,
                reps: "10-12",
                rest: "90 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Lie on a bench with your head near the end, holding a dumbbell with both hands above your chest. Lower the weight behind your head in an arc, feeling a stretch in your lats, then return to the starting position.",
              },
            ],
            Arms: [
              {
                name: "Dumbbell Bicep Curls",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Arms",
                instructions:
                  "Stand with feet shoulder-width apart, holding dumbbells at your sides. Curl the weights toward your shoulders, keeping your elbows close to your body, then lower with control.",
              },
              {
                name: "Dumbbell Tricep Extensions",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Arms",
                instructions:
                  "Hold a dumbbell with both hands above your head. Lower the weight behind your head by bending your elbows, keeping your upper arms stationary, then extend your arms to return to the starting position.",
              },
            ],
            Shoulders: [
              {
                name: "Dumbbell Shoulder Press",
                sets: 3,
                reps: "10-12",
                rest: "90 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Shoulders",
                instructions:
                  "Sit or stand with dumbbells at shoulder level, palms facing forward. Press the weights overhead until your arms are extended, then lower them back to the starting position.",
              },
              {
                name: "Lateral Raises",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand with feet shoulder-width apart, holding dumbbells at your sides. Raise your arms out to the sides until they're parallel with the floor, then lower with control.",
              },
            ],
            "Lower Body Push": [
              {
                name: "Dumbbell Squats",
                sets: 3,
                reps: "10-12",
                rest: "90 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Hold dumbbells at your sides, feet shoulder-width apart. Lower your body by bending your knees and pushing your hips back, then return to standing position.",
              },
              {
                name: "Dumbbell Lunges",
                sets: 3,
                reps: "10-12 per leg",
                rest: "90 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Hold dumbbells at your sides. Step forward with one leg and lower your body until both knees are bent at 90 degrees, then push back up to the starting position.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "Dumbbell Romanian Deadlift",
                sets: 3,
                reps: "10-12",
                rest: "90 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Hold dumbbells in front of your thighs, feet hip-width apart. Hinge at your hips to lower the weights along your legs while maintaining a slight knee bend and flat back.",
              },
              {
                name: "Dumbbell Glute Bridge",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Lie on your back with knees bent, feet flat on the floor, and a dumbbell on your hips. Push through your heels to lift your hips until your body forms a straight line from shoulders to knees.",
              },
            ],
            Core: [
              {
                name: "Dumbbell Russian Twists",
                sets: 3,
                reps: "12-15 per side",
                rest: "60 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Core",
                instructions:
                  "Sit on the floor with knees bent, holding a dumbbell with both hands. Lean back slightly and twist your torso to one side, then to the other, keeping the dumbbell close to your body.",
              },
              {
                name: "Dumbbell Side Bends",
                sets: 3,
                reps: "12-15 per side",
                rest: "60 sec",
                equipment: ["dumbbells"],
                muscleGroup: "Core",
                instructions:
                  "Stand with feet shoulder-width apart, holding a dumbbell in one hand. Bend sideways toward the weight, then return to an upright position using your obliques.",
              },
            ],
          }

          if (dumbbellExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...dumbbellExercises[group]]
          }
        }

        // If resistance bands are selected but we don't have enough exercises, add these specific ones
        if (exercisesByMuscleGroup[group].length < 2 && equipment.includes("resistance bands")) {
          const resistanceBandExercises = {
            "Upper Body Push": [
              {
                name: "Resistance Band Chest Press",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Stand with feet shoulder-width apart, resistance band behind your back. Hold handles at chest level with elbows bent. Press hands forward until arms are extended, then return to starting position.",
              },
              {
                name: "Resistance Band Push-ups",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["resistance bands", "bodyweight"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Place a resistance band across your upper back, holding ends with hands on the floor in push-up position. Perform push-ups against the band's resistance, focusing on controlled movement.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "Resistance Band Rows",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Secure band at chest height. Sit or stand facing anchor point. Hold handles with arms extended, then pull elbows back, squeezing shoulder blades together. Return to starting position with control.",
              },
              {
                name: "Resistance Band Lat Pulldowns",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Secure band to a high anchor point. Kneel or sit facing anchor. Grasp band with arms extended overhead, then pull down toward shoulders, focusing on engaging lats. Return to starting position slowly.",
              },
            ],
            Arms: [
              {
                name: "Resistance Band Bicep Curls",
                sets: 3,
                reps: "12-15",
                rest: "45 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Arms",
                instructions:
                  "Stand on middle of band with feet shoulder-width apart. Hold handles with palms facing forward. Curl hands toward shoulders while keeping elbows stationary, then lower with control.",
              },
              {
                name: "Resistance Band Tricep Extensions",
                sets: 3,
                reps: "12-15",
                rest: "45 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Arms",
                instructions:
                  "Secure band at head height behind you. Face away from anchor point. Hold handle with both hands behind head, elbows bent. Extend arms overhead, then return to starting position.",
              },
            ],
            Shoulders: [
              {
                name: "Resistance Band Shoulder Press",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand on band with feet shoulder-width apart. Hold handles at shoulder level, palms facing forward. Press hands overhead until arms are extended, then lower with control.",
              },
              {
                name: "Resistance Band Lateral Raises",
                sets: 3,
                reps: "12-15",
                rest: "45 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand on middle of band with feet close together. Hold handles at sides, palms facing in. Raise arms out to sides until parallel with floor, then lower with control.",
              },
            ],
            "Lower Body Push": [
              {
                name: "Resistance Band Squats",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Stand on band with feet shoulder-width apart. Hold handles at shoulder level. Perform a squat by bending knees and pushing hips back, then return to standing position.",
              },
              {
                name: "Resistance Band Leg Press",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Sit on floor with legs extended. Loop band around feet, holding handles at shoulder level. Press legs forward against resistance, then return to starting position.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "Resistance Band Deadlifts",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Stand on middle of band with feet hip-width apart. Hold handles at sides. Hinge at hips to lower torso while keeping back flat, then return to standing position.",
              },
              {
                name: "Resistance Band Hamstring Curls",
                sets: 3,
                reps: "12-15",
                rest: "45 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Secure band at ankle height. Lie face down with band around ankles. Curl heels toward buttocks against resistance, then return to starting position.",
              },
            ],
            Core: [
              {
                name: "Resistance Band Pallof Press",
                sets: 3,
                reps: "12-15 per side",
                rest: "45 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Core",
                instructions:
                  "Secure band at chest height. Stand sideways to anchor point. Hold handle with both hands at chest. Press hands away from chest while resisting rotation, then return to starting position.",
              },
              {
                name: "Resistance Band Russian Twists",
                sets: 3,
                reps: "12-15 per side",
                rest: "45 sec",
                equipment: ["resistance bands"],
                muscleGroup: "Core",
                instructions:
                  "Secure band at chest height. Sit on floor facing sideways to anchor point. Hold handle with both hands, then rotate torso away from anchor while keeping core engaged.",
              },
            ],
          }

          if (resistanceBandExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...resistanceBandExercises[group]]
          }
        }

        // Add TRX exercises if TRX is selected
        if (exercisesByMuscleGroup[group].length < 2 && equipment.includes("trx")) {
          const trxExercises = {
            "Upper Body Push": [
              {
                name: "TRX Push-ups",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Hold TRX handles with arms extended, body at an angle. Lower chest between handles by bending elbows, then push back up to starting position.",
              },
              {
                name: "TRX Chest Fly",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Face away from anchor point, holding handles with arms extended to sides at shoulder height. Bring hands together in front of chest, then return to starting position with control.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "TRX Rows",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Hold TRX handles with body at an angle, arms extended. Pull body up by bending elbows and squeezing shoulder blades, then lower with control.",
              },
              {
                name: "TRX Y-Pulls",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Hold TRX handles with arms extended in front. Pull body up while raising arms in a Y shape above head, focusing on upper back engagement.",
              },
            ],
            Arms: [
              {
                name: "TRX Bicep Curls",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Arms",
                instructions:
                  "Stand facing anchor point, holding handles with palms up. Lean back with arms extended. Curl body up by bending elbows, keeping upper arms stationary.",
              },
              {
                name: "TRX Tricep Extensions",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Arms",
                instructions:
                  "Face away from anchor point, holding handles with elbows bent at 90 degrees. Extend arms forward by straightening elbows, then return to starting position.",
              },
            ],
            Shoulders: [
              {
                name: "TRX Y-Raises",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand facing anchor point, holding handles with arms extended down. Raise arms in a Y shape above head, focusing on shoulder engagement.",
              },
              {
                name: "TRX T-Raises",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand facing anchor point, holding handles with arms extended down. Raise arms out to sides in a T shape, focusing on middle deltoid engagement.",
              },
            ],
            "Lower Body Push": [
              {
                name: "TRX Squats",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Hold TRX handles at chest level, facing anchor point. Perform a squat by bending knees and pushing hips back, using TRX for balance.",
              },
              {
                name: "TRX Lunges",
                sets: 3,
                reps: "10-12 per leg",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Hold TRX handles at chest level, facing anchor point. Step back into a lunge position, lowering back knee toward floor, then push back up.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "TRX Hamstring Curls",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Lie on back with heels in TRX straps. Lift hips off ground, then pull heels toward buttocks by bending knees. Return to starting position with control.",
              },
              {
                name: "TRX Hip Press",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Lie on back with heels in TRX straps. Lift hips off ground to form straight line from shoulders to heels, then lower with control.",
              },
            ],
            Core: [
              {
                name: "TRX Plank",
                sets: 3,
                duration: "30-45 sec",
                rest: "45 sec",
                equipment: ["trx"],
                muscleGroup: "Core",
                instructions:
                  "Place feet in TRX straps, assume push-up position with hands on ground. Hold body in straight line, engaging core throughout.",
              },
              {
                name: "TRX Pike",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["trx"],
                muscleGroup: "Core",
                instructions:
                  "Place feet in TRX straps, assume push-up position with hands on ground. Lift hips up toward ceiling by engaging core, forming an inverted V shape.",
              },
            ],
          }

          if (trxExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...trxExercises[group]]
          }
        }

        // Add medicine ball exercises if medicine ball is selected
        if (exercisesByMuscleGroup[group].length < 2 && equipment.includes("medicine ball")) {
          const medicineBallExercises = {
            "Upper Body Push": [
              {
                name: "Medicine Ball Chest Pass",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Stand facing wall with medicine ball at chest level. Throw ball forcefully against wall by extending arms, then catch and repeat.",
              },
              {
                name: "Medicine Ball Push-ups",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["medicine ball", "bodyweight"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Place one hand on medicine ball, other hand on floor in push-up position. Perform push-up, then roll ball to other hand and repeat.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "Medicine Ball Pull-overs",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Lie on back with medicine ball held above chest. Lower ball behind head in arc motion, feeling stretch in lats, then return to starting position.",
              },
              {
                name: "Medicine Ball Rows",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Place medicine ball on floor. Assume push-up position with one hand on ball. Perform row by pulling other hand up to side, then lower and switch sides.",
              },
            ],
            Arms: [
              {
                name: "Medicine Ball Bicep Curls",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Arms",
                instructions:
                  "Hold medicine ball with both hands at waist level. Curl ball toward shoulders, keeping elbows close to body, then lower with control.",
              },
              {
                name: "Medicine Ball Tricep Extensions",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Arms",
                instructions:
                  "Hold medicine ball with both hands above head. Lower ball behind head by bending elbows, keeping upper arms stationary, then extend arms to return to starting position.",
              },
            ],
            Shoulders: [
              {
                name: "Medicine Ball Front Raises",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Shoulders",
                instructions:
                  "Hold medicine ball with both hands in front of thighs. Raise ball forward and up to shoulder height, then lower with control.",
              },
              {
                name: "Medicine Ball Shoulder Press",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Shoulders",
                instructions:
                  "Hold medicine ball at shoulder level. Press ball overhead until arms are extended, then lower back to shoulders.",
              },
            ],
            "Lower Body Push": [
              {
                name: "Medicine Ball Squats",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Hold medicine ball at chest level. Perform squat by bending knees and pushing hips back, then return to standing position.",
              },
              {
                name: "Medicine Ball Lunges",
                sets: 3,
                reps: "10-12 per leg",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Hold medicine ball at chest level. Step forward into lunge position, lowering back knee toward floor, then push back up.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "Medicine Ball Deadlifts",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Place medicine ball on floor between feet. Hinge at hips to lower and grip ball, then stand by driving through heels while keeping back flat.",
              },
              {
                name: "Medicine Ball Glute Bridges",
                sets: 3,
                reps: "15-20",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Lie on back with knees bent, feet flat on floor, medicine ball on hips. Push through heels to lift hips until body forms straight line from shoulders to knees.",
              },
            ],
            Core: [
              {
                name: "Medicine Ball Russian Twists",
                sets: 3,
                reps: "12-15 per side",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Core",
                instructions:
                  "Sit on floor with knees bent, holding medicine ball with both hands. Lean back slightly and twist torso to one side, then to the other.",
              },
              {
                name: "Medicine Ball Slams",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["medicine ball"],
                muscleGroup: "Core",
                instructions:
                  "Stand with feet shoulder-width apart, medicine ball overhead. Forcefully throw ball to ground while bending at hips. Catch ball on bounce or pick it up and repeat.",
              },
            ],
          }

          if (medicineBallExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...medicineBallExercises[group]]
          }
        }

        // Add kettlebell exercises if kettlebells are selected
        if (exercisesByMuscleGroup[group].length < 2 && equipment.includes("kettlebells")) {
          const kettlebellExercises = {
            "Upper Body Push": [
              {
                name: "Kettlebell Floor Press",
                sets: 3,
                reps: "10-12 per arm",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Lie on floor with kettlebell at shoulder level. Press kettlebell up until arm is extended, then lower back to starting position.",
              },
              {
                name: "Kettlebell Push Press",
                sets: 3,
                reps: "10-12 per arm",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Hold kettlebell at shoulder level. Dip slightly at knees, then explosively extend legs and press kettlebell overhead.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "Kettlebell Rows",
                sets: 3,
                reps: "10-12 per arm",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Bend at hips with slight knee bend, holding kettlebell in one hand. Pull kettlebell to hip, keeping elbow close to body, then lower with control.",
              },
              {
                name: "Kettlebell High Pulls",
                sets: 3,
                reps: "10-12",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then explosively pull it up to shoulder height, leading with elbows.",
              },
            ],
            Arms: [
              {
                name: "Kettlebell Bicep Curls",
                sets: 3,
                reps: "12-15 per arm",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Arms",
                instructions:
                  "Stand with feet shoulder-width apart, holding kettlebell by handle with arm extended. Curl kettlebell toward shoulder, keeping elbow close to body, then lower with control.",
              },
              {
                name: "Kettlebell Tricep Extensions",
                sets: 3,
                reps: "12-15 per arm",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Arms",
                instructions:
                  "Hold kettlebell by handle with both hands above head. Lower kettlebell behind head by bending elbows, keeping upper arms stationary, then extend arms to return to starting position.",
              },
            ],
            Shoulders: [
              {
                name: "Kettlebell Shoulder Press",
                sets: 3,
                reps: "10-12 per arm",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Shoulders",
                instructions:
                  "Hold kettlebell at shoulder level. Press kettlebell overhead until arm is fully extended, then lower back to shoulder.",
              },
              {
                name: "Kettlebell Halos",
                sets: 3,
                reps: "10-12 each direction",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Shoulders",
                instructions:
                  "Hold kettlebell by horns (sides of handle) at chest level. Circle kettlebell around head, keeping elbows close to body, then reverse direction.",
              },
            ],
            "Lower Body Push": [
              {
                name: "Kettlebell Goblet Squats",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Hold kettlebell close to chest with both hands. Stand with feet slightly wider than shoulder-width. Squat down until thighs are parallel to ground, then push through heels to stand.",
              },
              {
                name: "Kettlebell Lunges",
                sets: 3,
                reps: "10-12 per leg",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Hold kettlebell close to chest with both hands. Step forward into lunge position, lowering back knee toward floor, then push back up.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "Kettlebell Swings",
                sets: 3,
                reps: "15-20",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Stand with feet shoulder-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then swing it between legs and up to shoulder height using hip drive.",
              },
              {
                name: "Kettlebell Deadlifts",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Stand with feet hip-width apart, kettlebell on floor between feet. Hinge at hips to grip kettlebell, then stand by driving through heels while keeping back flat.",
              },
            ],
            Core: [
              {
                name: "Kettlebell Russian Twists",
                sets: 3,
                reps: "12-15 per side",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Core",
                instructions:
                  "Sit on floor with knees bent, holding kettlebell with both hands. Lean back slightly and twist torso to one side, then to the other.",
              },
              {
                name: "Kettlebell Windmills",
                sets: 3,
                reps: "8-10 per side",
                rest: "60 sec",
                equipment: ["kettlebells"],
                muscleGroup: "Core",
                instructions:
                  "Stand with feet wider than shoulder-width, kettlebell held overhead in one hand. Keeping arm extended and eyes on kettlebell, hinge at hips to lower opposite hand toward floor, then return to standing.",
              },
            ],
          }

          if (kettlebellExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...kettlebellExercises[group]]
          }
        }

        // Add cable exercises if cables are selected
        if (exercisesByMuscleGroup[group].length < 2 && equipment.includes("cables")) {
          const cableExercises = {
            "Upper Body Push": [
              {
                name: "Cable Chest Press",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Stand in center of cable machine, holding handles at chest level. Press handles forward until arms are extended, then return to starting position.",
              },
              {
                name: "Cable Flyes",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Stand in center of cable machine, holding handles with arms extended to sides. Bring hands together in front of chest in arc motion, then return to starting position.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "Cable Rows",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Sit at cable row machine with feet on platform and knees slightly bent. Grasp handle with both hands, pull toward lower chest while keeping back straight, then return to starting position.",
              },
              {
                name: "Cable Lat Pulldowns",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Sit at lat pulldown machine with thighs secured. Grip bar with hands wider than shoulder-width. Pull bar down to upper chest, then slowly return to starting position.",
              },
            ],
            Arms: [
              {
                name: "Cable Bicep Curls",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Arms",
                instructions:
                  "Stand facing cable machine with attachment at lowest setting. Curl handle toward shoulders, keeping elbows close to body, then lower with control.",
              },
              {
                name: "Cable Tricep Pushdowns",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Arms",
                instructions:
                  "Stand facing cable machine with rope or bar attachment at chest height. Push attachment down until arms are fully extended, keeping elbows close to body.",
              },
            ],
            Shoulders: [
              {
                name: "Cable Lateral Raises",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand sideways to cable machine with attachment at lowest setting. Raise arm out to side until parallel with floor, then lower with control.",
              },
              {
                name: "Cable Face Pulls",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand facing cable machine with rope attachment at head height. Pull rope toward face, separating ends as you pull and focusing on squeezing shoulder blades together.",
              },
            ],
            "Lower Body Push": [
              {
                name: "Cable Squats",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Stand facing away from cable machine, holding attachment at shoulder level. Perform squat by bending knees and pushing hips back, then return to standing position.",
              },
              {
                name: "Cable Lunges",
                sets: 3,
                reps: "10-12 per leg",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Stand facing away from cable machine, holding attachment at shoulder level. Step forward into lunge position, lowering back knee toward floor, then push back up.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "Cable Pull-throughs",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Stand facing away from cable machine with attachment between legs. Hinge at hips to lower torso while keeping back flat, then return to standing position by driving hips forward.",
              },
              {
                name: "Cable Deadlifts",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Stand facing cable machine with attachment at lowest setting. Hinge at hips to grip attachment, then stand by driving through heels while keeping back flat.",
              },
            ],
            Core: [
              {
                name: "Cable Woodchoppers",
                sets: 3,
                reps: "12-15 per side",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Core",
                instructions:
                  "Stand sideways to cable machine with attachment at high position. Pull attachment down and across body in diagonal motion, rotating torso, then return to starting position.",
              },
              {
                name: "Cable Pallof Press",
                sets: 3,
                reps: "12-15 per side",
                rest: "60 sec",
                equipment: ["cables"],
                muscleGroup: "Core",
                instructions:
                  "Stand sideways to cable machine with attachment at chest height. Hold handle with both hands at chest. Press hands away from chest while resisting rotation, then return to starting position.",
              },
            ],
          }

          if (cableExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...cableExercises[group]]
          }
        }

        // Add foam roller exercises if foam roller is selected
        if (exercisesByMuscleGroup[group].length < 2 && equipment.includes("foam roller")) {
          const foamRollerExercises = {
            "Upper Body Push": [
              {
                name: "Foam Roller Chest Release",
                sets: 2,
                duration: "30-60 sec per side",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Lie on side with foam roller under chest/pectoral muscle. Apply pressure and slowly roll along muscle, pausing on tight spots.",
              },
              {
                name: "Foam Roller T-Spine Extension",
                sets: 2,
                reps: "10-12",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Sit with foam roller under upper back, hands behind head. Extend spine over roller, focusing on thoracic mobility.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "Foam Roller Lat Release",
                sets: 2,
                duration: "30-60 sec per side",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Lie on side with foam roller under lat muscle. Apply pressure and slowly roll along muscle, pausing on tight spots.",
              },
              {
                name: "Foam Roller Upper Back Release",
                sets: 2,
                duration: "30-60 sec",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Lie on back with foam roller under upper back. Cross arms over chest and slowly roll up and down, focusing on tight areas.",
              },
            ],
            Arms: [
              {
                name: "Foam Roller Tricep Release",
                sets: 2,
                duration: "30-60 sec per arm",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Arms",
                instructions:
                  "Place foam roller under tricep with arm extended. Apply pressure and slowly roll along muscle, pausing on tight spots.",
              },
              {
                name: "Foam Roller Forearm Release",
                sets: 2,
                duration: "30-60 sec per arm",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Arms",
                instructions:
                  "Place foam roller under forearm. Apply pressure and slowly roll along muscle, pausing on tight spots.",
              },
            ],
            Shoulders: [
              {
                name: "Foam Roller Shoulder Release",
                sets: 2,
                duration: "30-60 sec per shoulder",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Shoulders",
                instructions:
                  "Lie on side with foam roller under shoulder. Apply pressure and slowly roll along muscle, pausing on tight spots.",
              },
              {
                name: "Foam Roller Rotator Cuff Release",
                sets: 2,
                duration: "30-60 sec per shoulder",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Shoulders",
                instructions:
                  "Lie on side with foam roller under rear shoulder. Apply pressure and slowly roll along rotator cuff muscles, pausing on tight spots.",
              },
            ],
            "Lower Body Push": [
              {
                name: "Foam Roller Quad Release",
                sets: 2,
                duration: "30-60 sec per leg",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Lie face down with foam roller under thighs. Support upper body with forearms and roll from hip to knee, pausing on tight spots.",
              },
              {
                name: "Foam Roller Calf Release",
                sets: 2,
                duration: "30-60 sec per leg",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Sit with foam roller under calves. Lift hips off ground and roll from ankle to knee, pausing on tight spots.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "Foam Roller Hamstring Release",
                sets: 2,
                duration: "30-60 sec per leg",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Sit with foam roller under thighs. Support upper body with hands behind and roll from knee to glute, pausing on tight spots.",
              },
              {
                name: "Foam Roller Glute Release",
                sets: 2,
                duration: "30-60 sec per side",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Sit with foam roller under glutes. Cross one leg over opposite knee and roll on glute muscle, pausing on tight spots.",
              },
            ],
            Core: [
              {
                name: "Foam Roller Plank",
                sets: 3,
                duration: "20-30 sec",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Core",
                instructions:
                  "Place forearms on foam roller in plank position. Maintain straight body alignment while stabilizing on unstable surface.",
              },
              {
                name: "Foam Roller Back Extension",
                sets: 2,
                reps: "10-12",
                rest: "30 sec",
                equipment: ["foam roller"],
                muscleGroup: "Core",
                instructions:
                  "Sit with foam roller under lower back, hands behind head. Extend spine over roller, focusing on core engagement.",
              },
            ],
          }

          if (foamRollerExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...foamRollerExercises[group]]
          }
        }

        // Add yoga mat exercises if yoga mat is selected
        if (exercisesByMuscleGroup[group].length < 2 && equipment.includes("yoga mat")) {
          const yogaMatExercises = {
            "Upper Body Push": [
              {
                name: "Push-ups",
                sets: 3,
                reps: "10-15",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Start in plank position with hands slightly wider than shoulder-width. Lower body until chest nearly touches floor, then push back up.",
              },
              {
                name: "Downward Dog Push-ups",
                sets: 3,
                reps: "8-12",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Start in downward dog position. Bend elbows to lower head toward floor between hands, then push back up.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "Superman Hold",
                sets: 3,
                duration: "20-30 sec",
                rest: "45 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Lie face down with arms extended overhead. Lift arms, chest, and legs off floor simultaneously, holding position.",
              },
              {
                name: "Reverse Snow Angels",
                sets: 3,
                reps: "10-12",
                rest: "45 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Lie face down with arms at sides. Lift chest and arms off floor, then move arms in arc motion overhead and back to sides.",
              },
            ],
            Arms: [
              {
                name: "Plank Up-Downs",
                sets: 3,
                reps: "8-12",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Arms",
                instructions:
                  "Start in forearm plank position. Push up to hand plank one arm at a time, then lower back to forearm plank one arm at a time.",
              },
              {
                name: "Diamond Push-ups",
                sets: 3,
                reps: "8-12",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Arms",
                instructions:
                  "Perform push-up with hands close together forming diamond shape with thumbs and index fingers. Lower chest to hands, then push back up.",
              },
            ],
            Shoulders: [
              {
                name: "Pike Push-ups",
                sets: 3,
                reps: "8-12",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Shoulders",
                instructions:
                  "Start in downward dog position with hips high. Bend elbows to lower head toward floor, then push back up.",
              },
              {
                name: "Dolphin Pose",
                sets: 3,
                duration: "30-45 sec",
                rest: "45 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Shoulders",
                instructions:
                  "Start in forearm plank position. Walk feet toward arms while lifting hips high, creating inverted V shape.",
              },
            ],
            "Lower Body Push": [
              {
                name: "Bodyweight Squats",
                sets: 3,
                reps: "15-20",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Stand with feet shoulder-width apart. Lower body by bending knees and pushing hips back, then return to standing position.",
              },
              {
                name: "Lunges",
                sets: 3,
                reps: "12-15 per leg",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Stand with feet together. Step forward with one leg and lower body until both knees are bent at 90 degrees, then push back up.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "Glute Bridges",
                sets: 3,
                reps: "15-20",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Lie on back with knees bent, feet flat on floor. Push through heels to lift hips until body forms straight line from shoulders to knees.",
              },
              {
                name: "Single-Leg Glute Bridges",
                sets: 3,
                reps: "10-12 per leg",
                rest: "60 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Lie on back with knees bent, feet flat on floor. Extend one leg and push through heel of other foot to lift hips.",
              },
            ],
            Core: [
              {
                name: "Plank",
                sets: 3,
                duration: "30-60 sec",
                rest: "45 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Core",
                instructions:
                  "Start in push-up position with forearms on ground. Keep body in straight line from head to heels, engaging core throughout.",
              },
              {
                name: "Bicycle Crunches",
                sets: 3,
                reps: "15-20 per side",
                rest: "45 sec",
                equipment: ["yoga mat", "bodyweight"],
                muscleGroup: "Core",
                instructions:
                  "Lie on back with hands behind head, knees bent. Bring opposite elbow to opposite knee while extending other leg, alternating sides.",
              },
            ],
          }

          if (yogaMatExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...yogaMatExercises[group]]
          }
        }

        // Add band exercises if bands are selected
        if (exercisesByMuscleGroup[group].length < 2 && equipment.includes("bands")) {
          const bandExercises = {
            "Upper Body Push": [
              {
                name: "Band Push-ups",
                sets: 3,
                reps: "10-15",
                rest: "60 sec",
                equipment: ["bands", "bodyweight"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Place band across upper back, holding ends with hands on floor in push-up position. Perform push-ups against band resistance.",
              },
              {
                name: "Band Chest Press",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["bands"],
                muscleGroup: "Upper Body Push",
                instructions:
                  "Wrap band around back, holding ends at chest level. Press hands forward until arms are extended, then return to starting position.",
              },
            ],
            "Upper Body Pull": [
              {
                name: "Band Rows",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["bands"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Secure band at chest height. Sit or stand facing anchor point. Hold handles with arms extended, then pull elbows back, squeezing shoulder blades together.",
              },
              {
                name: "Band Pull-Aparts",
                sets: 3,
                reps: "15-20",
                rest: "45 sec",
                equipment: ["bands"],
                muscleGroup: "Upper Body Pull",
                instructions:
                  "Hold band with hands at shoulder width, arms extended in front. Pull band apart by moving hands outward, squeezing shoulder blades together.",
              },
            ],
            Arms: [
              {
                name: "Band Bicep Curls",
                sets: 3,
                reps: "12-15",
                rest: "45 sec",
                equipment: ["bands"],
                muscleGroup: "Arms",
                instructions:
                  "Stand on middle of band with feet shoulder-width apart. Hold handles with palms facing forward. Curl hands toward shoulders while keeping elbows stationary.",
              },
              {
                name: "Band Tricep Extensions",
                sets: 3,
                reps: "12-15",
                rest: "45 sec",
                equipment: ["bands"],
                muscleGroup: "Arms",
                instructions:
                  "Secure band at head height behind you. Face away from anchor point. Hold handle with both hands behind head, elbows bent. Extend arms overhead.",
              },
            ],
            Shoulders: [
              {
                name: "Band Lateral Raises",
                sets: 3,
                reps: "12-15",
                rest: "45 sec",
                equipment: ["bands"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand on middle of band with feet close together. Hold handles at sides, palms facing in. Raise arms out to sides until parallel with floor.",
              },
              {
                name: "Band Front Raises",
                sets: 3,
                reps: "12-15",
                rest: "45 sec",
                equipment: ["bands"],
                muscleGroup: "Shoulders",
                instructions:
                  "Stand on middle of band with feet shoulder-width apart. Hold handles in front of thighs, palms facing back. Raise arms forward until parallel with floor.",
              },
            ],
            "Lower Body Push": [
              {
                name: "Band Squats",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["bands"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Stand on band with feet shoulder-width apart. Hold handles at shoulder level. Perform squat by bending knees and pushing hips back.",
              },
              {
                name: "Band Lunges",
                sets: 3,
                reps: "10-12 per leg",
                rest: "60 sec",
                equipment: ["bands"],
                muscleGroup: "Lower Body Push",
                instructions:
                  "Stand on middle of band with one foot. Hold handles at shoulder level. Step back into lunge position, lowering back knee toward floor.",
              },
            ],
            "Lower Body Pull": [
              {
                name: "Band Deadlifts",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["bands"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Stand on middle of band with feet hip-width apart. Hold handles at sides. Hinge at hips to lower torso while keeping back flat.",
              },
              {
                name: "Band Good Mornings",
                sets: 3,
                reps: "12-15",
                rest: "60 sec",
                equipment: ["bands"],
                muscleGroup: "Lower Body Pull",
                instructions:
                  "Place band around upper back, holding ends at shoulders. Hinge at hips to lower torso while keeping back flat, then return to standing.",
              },
            ],
            Core: [
              {
                name: "Band Pallof Press",
                sets: 3,
                reps: "12-15 per side",
                rest: "45 sec",
                equipment: ["bands"],
                muscleGroup: "Core",
                instructions:
                  "Secure band at chest height. Stand sideways to anchor point. Hold handle with both hands at chest. Press hands away from chest while resisting rotation.",
              },
              {
                name: "Band Russian Twists",
                sets: 3,
                reps: "12-15 per side",
                rest: "45 sec",
                equipment: ["bands"],
                muscleGroup: "Core",
                instructions:
                  "Secure band at chest height. Sit on floor facing sideways to anchor point. Hold handle with both hands, then rotate torso away from anchor.",
              },
            ],
          }

          if (bandExercises[group]) {
            exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...bandExercises[group]]
          }
        }

        exercisesByMuscleGroup[group] = [...exercisesByMuscleGroup[group], ...additionalExercises]
      }
    })

    // Rebuild exercises array with balanced representation from each muscle group
    exercises = []
    muscleGroups.forEach((group) => {
      // Take up to 2 exercises from each muscle group
      const groupExercises = exercisesByMuscleGroup[group].slice(0, 2)
      exercises = [...exercises, ...groupExercises]
    })

    // Apply gender-specific adjustments
    if (gender === "female") {
      exercises = exercises.map((ex) => {
        const newEx = { ...ex }

        // Adjust rep ranges for female physiology (slightly higher reps)
        if (newEx.reps && newEx.reps.includes("-")) {
          const [min, max] = newEx.reps.split("-").map(Number)
          newEx.reps = `${min + 2}-${max + 2}`
        }

        return newEx
      })
    } else if (gender === "male") {
      exercises = exercises.map((ex) => {
        const newEx = { ...ex }

        // Adjust weight recommendations for male physiology
        if (newEx.weightNote) {
          newEx.weightNote += " Consider starting with a challenging weight that allows proper form."
        }

        return newEx
      })
    }

    // Add some randomness to exercise selection to ensure variety
    const shuffleArray = (array) => {
      const newArray = [...array]
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
      }
      return newArray
    }

    // Shuffle the exercises while maintaining muscle group balance
    exercises = shuffleArray(exercises)

    // Adjust based on difficulty
    if (difficulty === "beginner") {
      exercises = exercises.map((ex) => {
        const newEx = { ...ex }
        if (newEx.sets) newEx.sets = Math.max(2, newEx.sets - 1)
        if (newEx.reps && newEx.reps.includes("-")) {
          const [min, max] = newEx.reps.split("-").map(Number)
          newEx.reps = `${Math.max(6, min - 2)}-${Math.max(8, max - 2)}`
        }
        return newEx
      })
    } else if (difficulty === "advanced") {
      exercises = exercises.map((ex) => {
        const newEx = { ...ex }
        if (newEx.sets) newEx.sets = newEx.sets + 1
        if (newEx.reps && newEx.reps.includes("-")) {
          const [min, max] = newEx.reps.split("-").map(Number)
          newEx.reps = `${min + 2}-${max + 2}`
        }
        return newEx
      })
    }

    // Adjust workout based on duration
    let targetExerciseCount
    if (duration <= 20) {
      targetExerciseCount = Math.min(4, exercises.length) // Short workout
    } else if (duration <= 40) {
      targetExerciseCount = Math.min(6, exercises.length) // Medium workout
    } else if (duration <= 60) {
      targetExerciseCount = Math.min(8, exercises.length) // Long workout
    } else {
      targetExerciseCount = exercises.length // Very long workout
    }

    // Add instructions to exercises if they don't have them
    exercises = exercises.map((ex) => {
      if (!ex.instructions) {
        // Add generic instructions based on exercise name
        ex.instructions = `Perform ${ex.name} with proper form, focusing on controlled movements and breathing. Start with a lighter weight to master the technique before increasing intensity.`
      }
      return ex
    })

    // Limit exercises based on target count while ensuring at least one exercise per selected muscle group
    if (exercises.length > targetExerciseCount) {
      // First, ensure we have at least one exercise per muscle group
      const essentialExercises = []
      const remainingExercises = [...exercises]

      muscleGroups.forEach((group) => {
        const index = remainingExercises.findIndex((ex) => ex.muscleGroup === group)
        if (index !== -1) {
          essentialExercises.push(remainingExercises[index])
          remainingExercises.splice(index, 1)
        }
      })

      // Then fill the rest with remaining exercises
      const additionalCount = Math.max(0, targetExerciseCount - essentialExercises.length)
      exercises = [...essentialExercises, ...remainingExercises.slice(0, additionalCount)]
    }

    return {
      exercises,
      duration: data.duration,
      difficulty: data.difficulty,
      gender: data.gender,
      name: data.name,
      muscleGroups: data.muscleGroups,
    }
  }

  // Replace the regenerateBasedOnFeedback function with this improved version
  const regenerateBasedOnFeedback = (data, feedback) => {
    // Analyze feedback and adjust the plan
    const lowerFeedback = feedback.toLowerCase()
    const newData = { ...data }

    // Add some randomness to ensure a different plan
    newData.timestamp = Date.now() // Add a timestamp to ensure different randomization

    if (lowerFeedback.includes("too hard") || lowerFeedback.includes("difficult")) {
      newData.difficulty = "beginner"
    } else if (lowerFeedback.includes("too easy")) {
      newData.difficulty = "advanced"
    }

    if (lowerFeedback.includes("too long")) {
      newData.duration = Math.max(15, data.duration - 10)
    } else if (lowerFeedback.includes("too short")) {
      newData.duration = data.duration + 10
    }

    // Check for specific muscle group mentions
    const muscleKeywords = {
      arms: "Arms",
      chest: "Upper Body Push",
      back: "Upper Body Pull",
      legs: "Lower Body Push",
      shoulders: "Shoulders",
      core: "Core",
      abs: "Core",
    }

    for (const [keyword, group] of Object.entries(muscleKeywords)) {
      if (lowerFeedback.includes(keyword) && !newData.muscleGroups.includes(group)) {
        newData.muscleGroups.push(group)
      }
    }

    // Generate a new plan with the adjusted data
    return generateExercises(newData)
  }

  const handleSelectRecommendedWorkout = (workoutPlan) => {
    // Convert the recommended workout plan to our format
    const exercises = generateExercises({
      ...formData,
      muscleGroups: workoutPlan.muscleGroups,
      equipment: workoutPlan.equipment,
      duration: workoutPlan.duration,
      difficulty: workoutPlan.difficulty,
    })

    setWorkoutPlan(exercises)
    setIsGenerating(false)
    setStep(5)
    setShowSuccessToast(true)
    setShowRecommendations(false)

    // Scroll to top when showing results
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Add a function to format the workout plan card title to match the design in the screenshot
  const formatWorkoutPlanTitle = (name) => {
    // Check if the name ends with 's or just s
    if (name.endsWith("'s") || name.endsWith("s'")) {
      return `${name} Personalized Workout Plan`
    } else {
      return `${name}'s Personalized Workout Plan`
    }
  }

  // Glassmorphism card style
  const cardStyle = "backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl"

  // Check if a body part is selected (part of a selected muscle group)
  const isBodyPartSelected = (bodyPart) => {
    for (const [group, parts] of Object.entries(muscleGroupMapping)) {
      if (parts.includes(bodyPart) && formData.muscleGroups.includes(group)) {
        return true
      }
    }
    return false
  }

  // Get a list of selected muscle group names for display
  const getSelectedMuscleGroupNames = () => {
    return formData.muscleGroups.map((group) => {
      // Format the group name for display
      if (group === "Upper Body Push") return "Upper Body Push (Chest, Front Shoulders)"
      if (group === "Upper Body Pull") return "Upper Body Pull (Back, Lats)"
      if (group === "Lower Body Push") return "Upper Body Push (Quads, Calves)"
      if (group === "Lower Body Pull") return "Upper Body Pull (Hamstrings, Glutes)"
      if (group === "Core") return "Core (Abs, Obliques)"
      if (group === "Arms") return "Arms (Biceps, Triceps)"
      if (group === "Shoulders") return "Shoulders"
      return group
    })
  }

  // If returning user, redirect to dashboard
  if (isReturningUser) {
    return (
      <FavoritesProvider>
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-200 p-4 min-h-screen">
          <Card className={cardStyle}>
            <CardHeader>
              <CardTitle className="text-center text-indigo-900">Welcome back, {formData.name}!</CardTitle>
              <CardDescription className="text-center text-indigo-700">
                We're glad to see you again. Continue with your fitness journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-indigo-700">
                You can view your dashboard, create a new workout, or access your saved plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                >
                  View Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setIsReturningUser(false)
                    setStep(0) // Start from gender selection
                  }}
                  variant="outline"
                  className="border-indigo-300 text-indigo-700"
                >
                  Create New Workout
                </Button>
                <Button
                  onClick={() => setShowSavedPlans(true)}
                  variant="outline"
                  className="border-indigo-300 text-indigo-700"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> Saved Plans
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Favorites View Dialog */}
          <Dialog open={showSavedPlans} onOpenChange={setShowSavedPlans}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl text-indigo-900">Your Workout Collection</DialogTitle>
                <DialogDescription className="text-indigo-700">
                  View, manage, and load your saved and favorite workout plans
                </DialogDescription>
              </DialogHeader>
              <FavoritesView savedPlans={savedPlans} onLoadPlan={loadSavedPlan} onDeletePlan={deleteSavedPlan} />
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setShowSavedPlans(false)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FavoritesProvider>
    )
  }

  return (
    <WorkoutCompletionProvider>
      <FavoritesProvider>
        <div className="w-full bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-200 p-6 rounded-xl">
          {/* Home Button */}
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStep(-2)}
              className="bg-white/50 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              title="Go to Home"
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>

          {/* Success Toast */}
          <SuccessToast
            message={`${formData.name}, your workout plan is ready!`}
            visible={showSuccessToast}
            onClose={() => setShowSuccessToast(false)}
          />
          {/* Loading Overlay */}
          {isGenerating && <LoadingAnimation />}

          {/* Step -2: Name Input */}
          {step === -2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-center text-indigo-900">
                    Welcome to Your Personalized Workout Planner
                  </CardTitle>
                  <CardDescription className="text-center text-indigo-700">
                    Let's start by getting to know you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-indigo-900">
                      Your Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`bg-white/50 border-indigo-200 ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>
                </CardContent>
                <CardFooter className="px-4 py-4 flex justify-between">
                  <Button
                    onClick={() => setShowSavedPlans(true)}
                    variant="outline"
                    className="border-indigo-300 text-indigo-700"
                  >
                    <BookOpen className="w-4 h-4 mr-2" /> Saved Plans
                  </Button>
                  <Button
                    onClick={handleNameSubmit}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Step 0: Gender Selection */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-center text-indigo-900">Hi {formData.name}, Choose Your Gender</CardTitle>
                  <CardDescription className="text-center text-indigo-700">
                    This helps us tailor your workout plan to your specific needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-6">
                  <div className="grid grid-cols-2 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      onClick={() => handleGenderSelect("male")}
                      className={`cursor-pointer rounded-xl p-6 text-center ${formData.gender === "male" ? "bg-indigo-200 border-2 border-indigo-500" : "bg-white/50 border border-indigo-200"}`}
                    >
                      <Male className="w-20 h-20 mx-auto mb-4 text-indigo-700" />
                      <h3 className="text-xl font-semibold text-indigo-900">Male</h3>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      onClick={() => handleGenderSelect("female")}
                      className={`cursor-pointer rounded-xl p-6 text-center ${formData.gender === "female" ? "bg-indigo-200 border-2 border-indigo-500" : "bg-white/50 border border-indigo-200"}`}
                    >
                      <Female className="w-20 h-20 mx-auto mb-4 text-indigo-700" />
                      <h3 className="text-xl font-semibold text-indigo-900">Female</h3>
                    </motion.div>
                  </div>
                </CardContent>
                <CardFooter className="px-4 py-4 flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-indigo-300 text-indigo-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={() => setShowSavedPlans(true)}
                    variant="outline"
                    className="border-indigo-300 text-indigo-700"
                  >
                    <BookOpen className="w-4 h-4 mr-2" /> Saved Plans
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-indigo-900">Your Information</CardTitle>
                  <CardDescription className="text-indigo-700">
                    Fill in your details to get a personalized workout plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-indigo-900">
                        Age <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        placeholder="Enter your age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className={`bg-white/50 border-indigo-200 ${errors.age ? "border-red-500" : ""}`}
                      />
                      {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-indigo-900">
                        Weight (kg/lbs) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="weight"
                        name="weight"
                        placeholder="Enter your weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className={`bg-white/50 border-indigo-200 ${errors.weight ? "border-red-500" : ""}`}
                      />
                      {errors.weight && <p className="text-red-500 text-sm">{errors.weight}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-indigo-900">Workout Duration (minutes)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        defaultValue={[formData.duration]}
                        max={90}
                        min={15}
                        step={5}
                        onValueChange={handleSliderChange}
                        className="flex-1"
                      />
                      <span className="w-12 text-center text-indigo-900">{formData.duration}</span>
                    </div>
                    <p className="text-sm text-indigo-600 mt-1">
                      {formData.duration <= 20
                        ? "Short workout: Perfect for busy days"
                        : formData.duration <= 40
                          ? "Medium workout: Balanced time commitment"
                          : formData.duration <= 60
                            ? "Long workout: Great for comprehensive training"
                            : "Extended workout: Maximum results"}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="px-4 py-4 flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-indigo-300 text-indigo-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Goal Selection */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-indigo-900">Select Your Fitness Goal</CardTitle>
                  <CardDescription className="text-indigo-700">
                    This helps us tailor your workout plan to your specific needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        id: "strength",
                        name: "Strength Gain",
                        icon: <Dumbbell className="h-8 w-8" />,
                        description: "Build muscle strength through progressive overload",
                      },
                      {
                        id: "hypertrophy",
                        name: "Muscle Growth",
                        icon: <Activity className="h-8 w-8" />,
                        description: "Focus on muscle size and definition",
                      },
                      {
                        id: "cardio",
                        name: "Cardio & Endurance",
                        icon: <Heart className="h-8 w-8" />,
                        description: "Improve stamina and cardiovascular health",
                      },
                      {
                        id: "flexibility",
                        name: "Flexibility",
                        icon: <Yoga className="h-8 w-8" />,
                        description: "Enhance range of motion and mobility",
                      },
                      {
                        id: "fatLoss",
                        name: "Fat Loss",
                        icon: <Flame className="h-8 w-8" />,
                        description: "Burn calories and improve metabolism",
                      },
                      {
                        id: "general",
                        name: "General Fitness",
                        icon: <User className="h-8 w-8" />,
                        description: "Balanced workout combining different styles",
                      },
                    ].map((goal) => (
                      <motion.div
                        key={goal.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectChange("goal", goal.id)}
                        className={`cursor-pointer rounded-xl p-4 text-center ${
                          formData.goal === goal.id
                            ? "bg-indigo-100 border-2 border-indigo-500"
                            : "bg-white/50 border border-indigo-200"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`p-3 rounded-full ${formData.goal === goal.id ? "bg-indigo-200 text-indigo-700" : "bg-indigo-50 text-indigo-500"}`}
                          >
                            {goal.icon}
                          </div>
                          <h3 className="mt-3 font-medium text-indigo-900">{goal.name}</h3>
                          <p className="mt-1 text-xs text-indigo-700">{goal.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {errors.goal && <p className="text-red-500 text-sm mt-2">{errors.goal}</p>}
                </CardContent>
                <CardFooter className="px-4 py-4 flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-indigo-300 text-indigo-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Equipment Selection */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-indigo-900">Select Your Equipment</CardTitle>
                  <CardDescription className="text-indigo-700">
                    Choose the equipment you have available for your workouts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {equipmentOptions.slice(0, Math.ceil(equipmentOptions.length / 2)).map((equipment) => (
                        <div key={equipment} className="flex items-center">
                          <input
                            type="checkbox"
                            id={equipment}
                            name="equipment"
                            value={equipment.toLowerCase()}
                            checked={formData.equipment.includes(equipment.toLowerCase())}
                            onChange={(e) =>
                              handleCheckboxChange("equipment", equipment.toLowerCase(), e.target.checked)
                            }
                            className="h-5 w-5 rounded-sm border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor={equipment} className="ml-2 text-indigo-900">
                            {equipment}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {equipmentOptions.slice(Math.ceil(equipmentOptions.length / 2)).map((equipment) => (
                        <div key={equipment} className="flex items-center">
                          <input
                            type="checkbox"
                            id={equipment}
                            name="equipment"
                            value={equipment.toLowerCase()}
                            checked={formData.equipment.includes(equipment.toLowerCase())}
                            onChange={(e) =>
                              handleCheckboxChange("equipment", equipment.toLowerCase(), e.target.checked)
                            }
                            className="h-5 w-5 rounded-sm border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor={equipment} className="ml-2 text-indigo-900">
                            {equipment}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="selectAll"
                      name="selectAll"
                      checked={formData.equipment.length === equipmentOptions.length}
                      onChange={(e) => handleAllEquipment(e.target.checked)}
                      className="h-5 w-5 rounded-sm border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="selectAll" className="ml-2 text-indigo-900">
                      Select All
                    </label>
                  </div>
                  {errors.equipment && <p className="text-red-500 text-sm mt-2">{errors.equipment}</p>}
                </CardContent>
                <CardFooter className="px-4 py-4 flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-indigo-300 text-indigo-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Muscle Group Selection */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-indigo-900">Select Muscle Groups</CardTitle>
                  <CardDescription className="text-indigo-700">
                    Choose the muscle groups you want to focus on
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-6">
                  <EnhancedMuscleGroupDropdown
                    selectedGroups={formData.muscleGroups}
                    onChange={(groups) => {
                      setFormData({
                        ...formData,
                        muscleGroups: groups,
                      })
                      if (errors.muscleGroups) {
                        setErrors({
                          ...errors,
                          muscleGroups: null,
                        })
                      }
                    }}
                    exerciseDatabase={exerciseDatabase}
                  />

                  {errors.muscleGroups && <p className="text-red-500 text-sm">{errors.muscleGroups}</p>}

                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-indigo-900 mb-2">Selected Muscle Groups:</h3>
                    {formData.muscleGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.muscleGroups.map((group) => (
                          <div key={group} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                            {group}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-indigo-600 text-sm">No muscle groups selected yet</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="px-4 py-4 flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-indigo-300 text-indigo-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Muscle Group Confirmation Dialog */}
          <Dialog open={showMuscleConfirmation} onOpenChange={setShowMuscleConfirmation}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl text-indigo-900">Confirm Muscle Groups</DialogTitle>
                <DialogDescription className="text-indigo-700">
                  You've selected the following muscle groups to focus on:
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <ul className="space-y-2">
                  {getSelectedMuscleGroupNames().map((group, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-indigo-800">{group}</span>
                    </li>
                  ))}
                </ul>

                {formData.muscleGroups.length > 0 ? (
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <AlertTitle className="text-blue-800">Workout Focus</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Your workout will be tailored to these muscle groups with {formData.duration} minutes of{" "}
                      {formData.difficulty || "intermediate"} level exercises.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="mt-4 bg-amber-50 border-amber-200">
                    <AlertTitle className="text-amber-800">No muscle groups selected</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Please go back and select at least one muscle group to focus on.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowMuscleConfirmation(false)}
                  className="border-indigo-300 text-indigo-700"
                >
                  Go Back & Edit
                </Button>
                <Button
                  onClick={confirmMuscleGroups}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  disabled={formData.muscleGroups.length === 0}
                >
                  Confirm & Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                    {selectedExercise.equipment && (
                      <span className="block mb-2">Equipment: {selectedExercise.equipment.join(", ")}</span>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-medium text-indigo-900 mb-2">How to perform:</h3>
                    <p className="text-indigo-800">{selectedExercise.instructions}</p>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-medium text-indigo-900 mb-2">Tips:</h3>
                    <ul className="list-disc pl-5 text-indigo-800 space-y-1">
                      <li>Focus on proper form rather than speed</li>
                      <li>Breathe out during the exertion phase</li>
                      <li>Keep movements controlled and deliberate</li>
                      {selectedExercise.muscleGroup === "Core" && (
                        <li>Engage your core throughout the entire movement</li>
                      )}
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

          {/* Favorites View Dialog */}
          <Dialog open={showSavedPlans} onOpenChange={setShowSavedPlans}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl text-indigo-900">Your Workout Collection</DialogTitle>
                <DialogDescription className="text-indigo-700">
                  View, manage, and load your saved and favorite workout plans
                </DialogDescription>
              </DialogHeader>
              <FavoritesView savedPlans={savedPlans} onLoadPlan={loadSavedPlan} onDeletePlan={deleteSavedPlan} />
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setShowSavedPlans(false)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Step 5: Workout Plan Results */}
          {step === 5 && workoutPlan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <WorkoutPlanWithTracking plan={workoutPlan} cardStyle={cardStyle} />

              {/* Add Similar Workouts component */}
              <SimilarWorkouts
                currentWorkout={workoutPlan}
                userProfile={userProfile}
                onSelectWorkout={(selectedWorkout) => {
                  // Generate a workout plan based on the selected recommendation
                  setIsGenerating(true)

                  // Simulate API call or complex calculation
                  setTimeout(() => {
                    const exercises = generateExercises({
                      ...formData,
                      muscleGroups: selectedWorkout.muscleGroups,
                      equipment: selectedWorkout.equipment,
                      duration: selectedWorkout.duration,
                      difficulty: selectedWorkout.difficulty,
                    })

                    setWorkoutPlan(exercises)
                    setIsGenerating(false)
                    setShowSuccessToast(true)

                    // Scroll to top when showing results
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }, 1500) // Simulate 1.5 second delay for loading animation
                }}
              />
            </motion.div>
          )}

          {/* Step 6: Feedback Form */}
          {step === 6 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-indigo-900">Feedback</CardTitle>
                  <CardDescription className="text-indigo-700">
                    How satisfied were you with this workout plan?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-6">
                  <div className="space-y-2">
                    <Label className="text-indigo-900">Your Satisfaction</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setSatisfaction("very-satisfied")}
                        className={`border-indigo-300 text-indigo-700 ${satisfaction === "very-satisfied" ? "bg-indigo-100" : ""}`}
                      >
                        Very Satisfied
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSatisfaction("satisfied")}
                        className={`border-indigo-300 text-indigo-700 ${satisfaction === "satisfied" ? "bg-indigo-100" : ""}`}
                      >
                        Satisfied
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSatisfaction("neutral")}
                        className={`border-indigo-300 text-indigo-700 ${satisfaction === "neutral" ? "bg-indigo-100" : ""}`}
                      >
                        Neutral
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSatisfaction("unsatisfied")}
                        className={`border-indigo-300 text-indigo-700 ${satisfaction === "unsatisfied" ? "bg-indigo-100" : ""}`}
                      >
                        Unsatisfied
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback" className="text-indigo-900">
                      Additional Feedback
                    </Label>
                    <Input
                      id="feedback"
                      name="feedback"
                      placeholder="Enter your feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="bg-white/50 border-indigo-200"
                    />
                  </div>
                </CardContent>
                <CardFooter className="px-4 py-4 flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="border-indigo-300 text-indigo-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={submitFeedback}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    Submit Feedback
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Step 7: Thank You */}
          {step === 7 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-center text-indigo-900">Thank You!</CardTitle>
                  <CardDescription className="text-center text-indigo-700">
                    Thank you for your feedback. We appreciate your input.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-6 text-center">
                  <p className="text-indigo-700">
                    Your feedback helps us improve our workout plans and provide you with the best possible experience.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </FavoritesProvider>
    </WorkoutCompletionProvider>
  )
}
