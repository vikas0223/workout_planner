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
  Dumbbell,
  Activity,
  Heart,
  SpaceIcon as Yoga,
  Flame,
  User,
  Home,
} from "lucide-react"
import { exerciseDatabase } from "@/lib/exercise-database"
import { WorkoutEngine } from "@/features/workout-engine"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import SuccessToast from "@/components/success-toast"
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
  // State variables remain the same
  const [formData, setFormData] = useState<any>({
    name: "",
    gender: "",
    age: "",
    weight: "",
    duration: 30,
    equipment: [] as string[],
    difficulty: "intermediate",
    muscleGroups: [] as string[],
    goal: "",
  })

  const [step, setStep] = useState(-2)
  const [workoutPlan, setWorkoutPlan] = useState<any>(null)
  const [feedback, setFeedback] = useState("")
  const [satisfaction, setSatisfaction] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [savedPlans, setSavedPlans] = useState<any[]>([])
  const [selectedExercise, setSelectedExercise] = useState<any>(null)
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
        setFormData((prevData: any) => ({
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

  // All the handler functions remain the same
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    if (name === "age") {
      const age = Number.parseInt(value);
      if (value && (isNaN(age) || age < 16 || age > 100)) {
        setErrors((prev: any) => ({ ...prev, age: "Age must be between 16 and 100 years" }));
      } else {
        setErrors((prev: any) => ({ ...prev, age: undefined }));
      }
    } else {
      setErrors((prev: any) => ({ ...prev, [name]: undefined }));
    }
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }

  // Other handler functions remain the same
  const handleGoalSelect = (goal: any) => {
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
    const raw = localStorage.getItem("returningUsers");
    const returningUsers: any[] = raw ? JSON.parse(raw) : [];

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

  const handleGenderSelect = (gender: any) => {
    setFormData((prev: any) => ({ ...prev, gender }));
    setStep(-1);
  }

  const handleSelectChange = (name: any, value: any) => {
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error for this field
    if ((errors as any)[name]) {
      setErrors({
        ...errors,
        [name]: undefined,
      })
    }
  }

  const handleSliderChange = (value: any) => {
    setFormData({
      ...formData,
      duration: value[0],
    })
  }

  const handleCheckboxChange = (name: any, value: any, checked?: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        [name]: [...formData[name], value],
      })
    } else {
      setFormData({
        ...formData,
        [name]: formData[name].filter((item: any) => item !== value),
      })
    }

    // Clear error for this field
    if ((errors as any)[name]) {
      setErrors({
        ...errors,
        [name]: undefined,
      })
    }
  }

  const handleMuscleGroupSelect = (group: any) => {
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
      const newMuscleGroups = formData.muscleGroups.filter((g: any) => g !== group)
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
        muscleGroups: undefined,
      })
    }
  }

  const handleBodyPartSelect = (bodyPart: any) => {
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

  const handleAllEquipment = (checked: any) => {
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
    const newErrors: Record<string, string> = {}

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

    setErrors(newErrors as Record<string, string>)
    return Object.keys(newErrors).length === 0
  }

  const adjustDifficultyBasedOnHistory = () => {
    if (userProfile) {
      const adjustment = analyzeDifficultyAdjustment(userProfile?.completedWorkouts as any || [], userProfile?.ratings || [])

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
  const addToFavorites = (workoutPlan: any) => {
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

  const deleteSavedPlan = (id: any) => {
    const updatedSavedPlans = savedPlans.filter((plan) => plan.id !== id)
    setSavedPlans(updatedSavedPlans)

    // Update localStorage
    localStorage.setItem("savedWorkoutPlans", JSON.stringify(updatedSavedPlans))
  }

  const loadSavedPlan = (savedPlan: any) => {
    setWorkoutPlan(savedPlan.plan)
    setFormData(savedPlan.formData)
    setShowSavedPlans(false)
    setStep(5)
  }

  const showExerciseGuidance = (exercise: any) => {
    setSelectedExercise(exercise)
  }

  // generateExercises function remains the same
  const generateExercises = (data: any) => {
    console.log("Generating exercises with domain engine for data:", data);
    if (!data.muscleGroups || data.muscleGroups.length === 0) {
      return {
        exercises: [],
        duration: data.duration,
        difficulty: data.difficulty,
        gender: data.gender,
        name: data.name,
        muscleGroups: [],
      };
    }

    const generated = WorkoutEngine.generateWorkoutPlan({
      name: data.name,
      fitnessLevel: data.difficulty,
      primaryGoal: data.goal,
      targetMuscles: data.muscleGroups,
      equipment: data.equipment,
      durationMinutes: data.duration,
      gender: data.gender,
    });

    return {
      exercises: generated.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        muscleGroup: ex.targetMuscles?.[0] || data.muscleGroups[0],
        equipment: ex.equipment,
        instructions: ex.notes || "Perform exercise with controlled form and full range of motion.",
      })),
      duration: data.duration,
      difficulty: data.difficulty,
      gender: data.gender,
      name: data.name,
      muscleGroups: data.muscleGroups,
      goal: data.goal,
      type: "Custom Routine",
    };
  }
  const regenerateBasedOnFeedback = (data: any, feedback: any) => {
    // Implementation details omitted for brevity
    // ...

    // Return the regenerated exercises
    return generateExercises(data)
  }

  const handleSelectRecommendedWorkout = (workoutPlan: any) => {
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
  const formatWorkoutPlanTitle = (name: any) => {
    // Check if the name ends with 's or just s
    if (name.endsWith("'s") || name.endsWith("s'")) {
      return `${name} Personalized Workout Plan`
    } else {
      return `${name}'s Personalized Workout Plan`
    }
  }

  // Glassmorphism card style with improved shadows and rounded corners
  const cardStyle =
    "backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl rounded-xl overflow-hidden transition-all duration-300"

  // Check if a body part is selected (part of a selected muscle group)
  const isBodyPartSelected = (bodyPart: any) => {
    for (const [group, parts] of Object.entries(muscleGroupMapping)) {
      if (parts.includes(bodyPart) && formData.muscleGroups.includes(group)) {
        return true
      }
    }
    return false
  }

  // Get a list of selected muscle group names for display
  const getSelectedMuscleGroupNames = () => {
    return formData.muscleGroups.map((group: any) => {
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
        <div className="w-full max-w-full sm:max-w-[90%] md:max-w-3xl mx-auto bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-200 p-3 sm:p-4 md:p-6 rounded-xl">
          <Card className={cardStyle}>
            <CardHeader className="p-4 sm:p-5 md:p-6 text-center">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl text-indigo-900">
                Welcome back, {formData.name}!
              </CardTitle>
              <CardDescription className="text-indigo-700 mt-1 sm:mt-2">
                We're glad to see you again. Continue with your fitness journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0 text-center">
              <p className="text-indigo-700">
                You can view your dashboard, create a new workout, or access your saved plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4 sm:mt-6">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  View Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setIsReturningUser(false)
                    setStep(0) // Start from gender selection
                  }}
                  variant="outline"
                  className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
                >
                  Create New Workout
                </Button>
                <Button
                  onClick={() => setShowSavedPlans(true)}
                  variant="outline"
                  className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
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
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300"
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
        <div className="w-full max-w-full sm:max-w-[90%] md:max-w-3xl mx-auto bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-200 p-3 sm:p-4 md:p-6 rounded-xl relative">
          {/* Home Button - Fixed positioning inside the container */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStep(-2)}
              className="bg-white/50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition-all duration-300 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full shadow-sm"
              title="Go to Home"
              aria-label="Go to Home"
            >
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
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
                <CardHeader className="p-4 sm:p-5 md:p-6 text-center">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl text-indigo-900">
                    Welcome to Your Personalized Workout Planner
                  </CardTitle>
                  <CardDescription className="text-indigo-700 mt-1 sm:mt-2">
                    Let's start by getting to know you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="name" className="text-indigo-900 font-medium">
                      Your Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`bg-white/50 border-indigo-200 transition-all duration-300 ${errors.name ? "border-red-500" : "focus:border-indigo-400"}`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                </CardContent>
                <CardFooter className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    onClick={() => setShowSavedPlans(true)}
                    variant="outline"
                    className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <BookOpen className="w-4 h-4 mr-2" /> Saved Plans
                  </Button>
                  <Button
                    onClick={handleNameSubmit}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
                <CardHeader className="p-4 sm:p-5 md:p-6 text-center">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl text-indigo-900">
                    Hi {formData.name}, Choose Your Gender
                  </CardTitle>
                  <CardDescription className="text-indigo-700 mt-1 sm:mt-2">
                    This helps us tailor your workout plan to your specific needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      onClick={() => handleGenderSelect("male")}
                      className={`cursor-pointer rounded-xl p-4 sm:p-6 text-center transition-all duration-300 ${formData.gender === "male" ? "bg-indigo-200 border-2 border-indigo-500" : "bg-white/50 border border-indigo-200 hover:shadow-md"}`}
                    >
                      <Male className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 text-indigo-700" />
                      <h3 className="text-lg sm:text-xl font-semibold text-indigo-900">Male</h3>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      onClick={() => handleGenderSelect("female")}
                      className={`cursor-pointer rounded-xl p-4 sm:p-6 text-center transition-all duration-300 ${formData.gender === "female" ? "bg-indigo-200 border-2 border-indigo-500" : "bg-white/50 border border-indigo-200 hover:shadow-md"}`}
                    >
                      <Female className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 text-indigo-700" />
                      <h3 className="text-lg sm:text-xl font-semibold text-indigo-900">Female</h3>
                    </motion.div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={() => setShowSavedPlans(true)}
                    variant="outline"
                    className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
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
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl text-indigo-900">Your Information</CardTitle>
                  <CardDescription className="text-indigo-700 mt-1 sm:mt-2">
                    Fill in your details to get a personalized workout plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-indigo-900 font-medium">
                        Age <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        placeholder="Enter your age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className={`bg-white/50 border-indigo-200 transition-all duration-300 ${errors.age ? "border-red-500" : "focus:border-indigo-400"}`}
                      />
                      {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-indigo-900 font-medium">
                        Weight (kg/lbs) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="weight"
                        name="weight"
                        placeholder="Enter your weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className={`bg-white/50 border-indigo-200 transition-all duration-300 ${errors.weight ? "border-red-500" : "focus:border-indigo-400"}`}
                      />
                      {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-indigo-900 font-medium">Workout Duration (minutes)</Label>
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
                <CardFooter className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl text-indigo-900">
                    Select Your Fitness Goal
                  </CardTitle>
                  <CardDescription className="text-indigo-700 mt-1 sm:mt-2">
                    This helps us tailor your workout plan to your specific needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {[
                      {
                        id: "strength",
                        name: "Strength Gain",
                        icon: <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8" />,
                        description: "Build muscle strength through progressive overload",
                      },
                      {
                        id: "hypertrophy",
                        name: "Muscle Growth",
                        icon: <Activity className="h-6 w-6 sm:h-8 sm:w-8" />,
                        description: "Focus on muscle size and definition",
                      },
                      {
                        id: "cardio",
                        name: "Cardio & Endurance",
                        icon: <Heart className="h-6 w-6 sm:h-8 sm:w-8" />,
                        description: "Improve stamina and cardiovascular health",
                      },
                      {
                        id: "flexibility",
                        name: "Flexibility",
                        icon: <Yoga className="h-6 w-6 sm:h-8 sm:w-8" />,
                        description: "Enhance range of motion and mobility",
                      },
                      {
                        id: "fatLoss",
                        name: "Fat Loss",
                        icon: <Flame className="h-6 w-6 sm:h-8 sm:w-8" />,
                        description: "Burn calories and improve metabolism",
                      },
                      {
                        id: "general",
                        name: "General Fitness",
                        icon: <User className="h-6 w-6 sm:h-8 sm:w-8" />,
                        description: "Balanced workout combining different styles",
                      },
                    ].map((goal) => (
                      <motion.div
                        key={goal.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelectChange("goal", goal.id)}
                        className={`cursor-pointer rounded-xl p-3 sm:p-4 text-center transition-all duration-300 ${
                          formData.goal === goal.id
                            ? "bg-indigo-100 border-2 border-indigo-500"
                            : "bg-white/50 border border-indigo-200 hover:shadow-md"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`p-2 sm:p-3 rounded-full transition-all duration-300 ${formData.goal === goal.id ? "bg-indigo-200 text-indigo-700" : "bg-indigo-50 text-indigo-500"}`}
                          >
                            {goal.icon}
                          </div>
                          <h3 className="mt-2 sm:mt-3 font-medium text-indigo-900">{goal.name}</h3>
                          <p className="mt-1 text-xs text-indigo-700">{goal.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {errors.goal && <p className="text-red-500 text-sm mt-2">{errors.goal}</p>}
                </CardContent>
                <CardFooter className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl text-indigo-900">
                    Select Your Equipment
                  </CardTitle>
                  <CardDescription className="text-indigo-700 mt-1 sm:mt-2">
                    Choose the equipment you have available for your workouts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            className="h-5 w-5 rounded-sm border-indigo-300 text-indigo-600 focus:ring-indigo-500 transition-all duration-300"
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
                            className="h-5 w-5 rounded-sm border-indigo-300 text-indigo-600 focus:ring-indigo-500 transition-all duration-300"
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
                      className="h-5 w-5 rounded-sm border-indigo-300 text-indigo-600 focus:ring-indigo-500 transition-all duration-300"
                    />
                    <label htmlFor="selectAll" className="ml-2 text-indigo-900">
                      Select All
                    </label>
                  </div>
                  {errors.equipment && <p className="text-red-500 text-sm mt-2">{errors.equipment}</p>}
                </CardContent>
                <CardFooter className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl text-indigo-900">
                    Select Muscle Groups
                  </CardTitle>
                  <CardDescription className="text-indigo-700 mt-1 sm:mt-2">
                    Choose the muscle groups you want to focus on
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0">
                  <EnhancedMuscleGroupDropdown
                    selectedGroups={formData.muscleGroups}
                    onChange={(groups: any) => {
                      setFormData({
                        ...formData,
                        muscleGroups: groups,
                      })
                      if (errors.muscleGroups) {
                        setErrors({
                          ...errors,
                          muscleGroups: undefined,
                        })
                      }
                    }}
                    exerciseDatabase={exerciseDatabase}
                  />

                  {errors.muscleGroups && <p className="text-red-500 text-sm">{errors.muscleGroups}</p>}

                  <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-indigo-900 mb-2">Selected Muscle Groups:</h3>
                    {formData.muscleGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.muscleGroups.map((group: any) => (
                          <div
                            key={group}
                            className="bg-indigo-100 text-indigo-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                          >
                            {group}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-indigo-600 text-sm">No muscle groups selected yet</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Muscle Group Confirmation Dialog */}
          {/* Exercise Guidance Dialog */}
          {/* Favorites View Dialog */}
          {/* Step 5: Workout Plan Results */}
          {step === 5 && workoutPlan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <WorkoutPlanWithTracking
                plan={workoutPlan}
                cardStyle={cardStyle}
                onRegenerateWorkout={generateWorkoutPlan}
              />

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
          {/* Step 7: Thank You */}
        </div>
      </FavoritesProvider>
    </WorkoutCompletionProvider>
  )
}
