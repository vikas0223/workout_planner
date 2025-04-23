"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Activity } from "lucide-react"
import MuscleGroupDropdown from "@/components/muscle-group-dropdown"
import EquipmentSelectionGrid from "@/components/equipment-selection-grid"

export default function SimplifiedWorkoutFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    muscleGroups: [],
    equipment: [],
    goal: "strength", // Default goal
    difficulty: "intermediate", // Default difficulty
  })
  const [errors, setErrors] = useState({})

  const cardStyle = "backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl"

  const validateStep = () => {
    const newErrors = {}

    if (step === 0 && formData.muscleGroups.length === 0) {
      newErrors.muscleGroups = "Please select at least one muscle group"
    }

    if (step === 1 && formData.equipment.length === 0) {
      newErrors.equipment = "Please select at least one equipment option"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep()) {
      if (step < 1) {
        setStep(step + 1)
      } else {
        onComplete(formData)
      }
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <>
      {/* Step 0: Muscle Group Selection */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className={cardStyle}>
            <CardHeader>
              <CardTitle className="text-indigo-900">
                What do you want to train? <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Select the muscle groups you want to focus on
              </CardDescription>
              {errors.muscleGroups && <p className="text-red-500 text-sm mt-2">{errors.muscleGroups}</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              <MuscleGroupDropdown
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
              />
            </CardContent>
            <CardFooter className="pt-2 flex justify-end">
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

      {/* Step 1: Equipment Selection */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className={cardStyle}>
            <CardHeader>
              <CardTitle className="text-indigo-900">
                Equipment Selection <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Select the equipment you have access to for your workout
              </CardDescription>
              {errors.equipment && <p className="text-red-500 text-sm mt-2">{errors.equipment}</p>}
            </CardHeader>
            <CardContent>
              <EquipmentSelectionGrid
                selectedEquipment={formData.equipment}
                onChange={(equipment) => {
                  setFormData({
                    ...formData,
                    equipment,
                  })
                  if (errors.equipment) {
                    setErrors({
                      ...errors,
                      equipment: null,
                    })
                  }
                }}
              />
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <Button onClick={prevStep} variant="outline" className="border-indigo-300 text-indigo-700">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              >
                <Activity className="w-4 h-4 mr-2" /> Generate Workout
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </>
  )
}
