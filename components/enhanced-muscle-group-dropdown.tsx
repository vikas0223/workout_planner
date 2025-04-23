"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function EnhancedMuscleGroupDropdown({ selectedGroups, onChange, exerciseDatabase }) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredGroup, setHoveredGroup] = useState(null)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const muscleGroups = [
    {
      id: "Upper Body Push",
      name: "Upper Body Push",
      description: "Chest, Triceps, Front Shoulders",
      targetMuscles: ["Chest", "Triceps", "Front Deltoids"],
      sampleExercises: ["Bench Press", "Push-ups", "Chest Flyes", "Shoulder Press"],
    },
    {
      id: "Upper Body Pull",
      name: "Upper Body Pull",
      description: "Back, Biceps, Rear Shoulders",
      targetMuscles: ["Lats", "Rhomboids", "Biceps", "Rear Deltoids"],
      sampleExercises: ["Pull-ups", "Rows", "Lat Pulldowns", "Face Pulls"],
    },
    {
      id: "Lower Body Push",
      name: "Lower Body Push",
      description: "Quads, Calves, Glutes (partially)",
      targetMuscles: ["Quadriceps", "Calves", "Glutes (front)"],
      sampleExercises: ["Squats", "Leg Press", "Lunges", "Calf Raises"],
    },
    {
      id: "Lower Body Pull",
      name: "Lower Body Pull",
      description: "Hamstrings, Glutes, Lower Back",
      targetMuscles: ["Hamstrings", "Glutes", "Erector Spinae"],
      sampleExercises: ["Deadlifts", "Romanian Deadlifts", "Hip Thrusts", "Glute Bridges"],
    },
    {
      id: "Core",
      name: "Core",
      description: "Abs, Obliques, Lower Back",
      targetMuscles: ["Rectus Abdominis", "Obliques", "Transverse Abdominis"],
      sampleExercises: ["Planks", "Crunches", "Russian Twists", "Leg Raises"],
    },
    {
      id: "Arms",
      name: "Arms",
      description: "Biceps, Triceps, Forearms",
      targetMuscles: ["Biceps Brachii", "Triceps Brachii", "Brachialis", "Forearm Flexors"],
      sampleExercises: ["Bicep Curls", "Tricep Extensions", "Hammer Curls", "Skull Crushers"],
    },
    {
      id: "Shoulders",
      name: "Shoulders",
      description: "Front, Side, and Rear Deltoids",
      targetMuscles: ["Anterior Deltoid", "Lateral Deltoid", "Posterior Deltoid"],
      sampleExercises: ["Shoulder Press", "Lateral Raises", "Reverse Flyes", "Upright Rows"],
    },
    {
      id: "All",
      name: "Full Body",
      description: "All major muscle groups",
      targetMuscles: ["All major muscle groups"],
      sampleExercises: ["Compound movements", "Circuit training"],
    },
  ]

  // Get sample exercises for a muscle group from the exercise database
  const getExercisesForMuscleGroup = (groupId) => {
    if (!exerciseDatabase) return []

    let exercises = []

    // Look through all categories in the exercise database
    Object.values(exerciseDatabase).forEach((goalExercises) => {
      Object.values(goalExercises).forEach((typeExercises) => {
        // Filter exercises for this muscle group
        const matchingExercises = typeExercises.filter((ex) => ex.muscleGroup === groupId).map((ex) => ex.name)

        exercises = [...exercises, ...matchingExercises]
      })
    })

    // Return unique exercises, up to 5
    return [...new Set(exercises)].slice(0, 5)
  }

  const handleSelect = (groupId) => {
    if (groupId === "All") {
      // If All is selected, include all muscle groups except "All" itself
      const allGroups = muscleGroups.filter((group) => group.id !== "All").map((group) => group.id)
      onChange(allGroups)
    } else if (selectedGroups.includes(groupId)) {
      // If the group is already selected, remove it
      onChange(selectedGroups.filter((id) => id !== groupId))
    } else {
      // Add the group to the selection
      onChange([...selectedGroups, groupId])
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="w-full justify-between bg-white/50 border-indigo-200 text-indigo-900 font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedGroups.length === 0
            ? "Select muscle groups"
            : selectedGroups.length === muscleGroups.length - 1
              ? "All muscle groups"
              : `${selectedGroups.length} muscle group${selectedGroups.length > 1 ? "s" : ""} selected`}
        </span>
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-indigo-100 overflow-hidden">
          <div className="max-h-64 overflow-auto">
            {muscleGroups.map((group) => (
              <div
                key={group.id}
                className={`px-3 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors ${
                  group.id === "All" ? "border-t border-indigo-100" : ""
                }`}
                onClick={() => {
                  handleSelect(group.id)
                  if (group.id === "All") setIsOpen(false)
                }}
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-indigo-900 flex items-center">
                      {group.name}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 ml-1 text-indigo-400" />
                          </TooltipTrigger>
                          <TooltipContent className="w-80">
                            <div className="space-y-2">
                              <p>
                                <span className="font-bold">Target Muscles:</span> {group.targetMuscles.join(", ")}
                              </p>
                              <p>
                                <span className="font-bold">Sample Exercises:</span>{" "}
                                {getExercisesForMuscleGroup(group.id).join(", ")}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-sm text-indigo-600">{group.description}</div>

                    {/* Show sample exercises when hovering */}
                    {hoveredGroup === group.id && (
                      <div className="mt-1 text-xs text-indigo-500">
                        <span className="font-medium">Example exercises: </span>
                        {getExercisesForMuscleGroup(group.id).join(", ")}
                      </div>
                    )}
                  </div>
                  {(group.id === "All" && selectedGroups.length === muscleGroups.length - 1) ||
                  (group.id !== "All" && selectedGroups.includes(group.id)) ? (
                    <Check className="h-5 w-5 text-indigo-600" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
