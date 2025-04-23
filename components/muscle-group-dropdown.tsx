"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MuscleGroupDropdown({ selectedGroups, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
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
      description: "Lateral Deltoid, Triceps, Chest, Front Shoulders",
    },
    {
      id: "Upper Body Pull",
      name: "Upper Body Pull",
      description: "Biceps, Traps (mid-back), Lats, Rear Shoulders",
    },
    {
      id: "Lower Body Push",
      name: "Lower Body Push",
      description: "Calves, Glutes, Quads",
    },
    {
      id: "Lower Body Pull",
      name: "Lower Body Pull",
      description: "Calves, Glutes, Hamstrings",
    },
    {
      id: "Core",
      name: "Core",
      description: "Lower back, Abdominals, Obliques",
    },
    {
      id: "Arms",
      name: "Arms",
      description: "Biceps, Triceps",
    },
    {
      id: "Shoulders",
      name: "Shoulders",
      description: "Front Shoulders, Rear Shoulders",
    },
    {
      id: "All",
      name: "Full Body",
      description: "Glutes, Hamstrings, Lats, Quads, Chest, Front Shoulders, Rear Shoulders",
    },
  ]

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
          <div className="max-h-60 overflow-auto">
            {muscleGroups.map((group) => (
              <div
                key={group.id}
                className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors ${
                  group.id === "All" ? "border-t border-indigo-100" : ""
                }`}
                onClick={() => {
                  handleSelect(group.id)
                  if (group.id === "All") setIsOpen(false)
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-indigo-900">{group.name}</div>
                    <div className="text-sm text-indigo-600">{group.description}</div>
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
