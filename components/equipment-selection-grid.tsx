"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

export default function EquipmentSelectionGrid({ selectedEquipment, onChange }) {
  const equipmentOptions = [
    {
      id: "all",
      name: "Select All",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <circle cx="7" cy="14" r="3" />
          <circle cx="14" cy="14" r="5" />
          <circle cx="17" cy="14" r="2" />
        </svg>
      ),
    },
    {
      id: "barbells",
      name: "Barbell",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="7" y1="8" x2="7" y2="16" />
          <line x1="17" y1="8" x2="17" y2="16" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="20" cy="12" r="2" />
        </svg>
      ),
    },
    {
      id: "dumbbells",
      name: "Dumbbells",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <circle cx="7" cy="12" r="3" />
          <circle cx="17" cy="12" r="3" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
    },
    {
      id: "bodyweight",
      name: "Bodyweight",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M12,3 C13.6568542,3 15,4.34314575 15,6 C15,7.65685425 13.6568542,9 12,9 C10.3431458,9 9,7.65685425 9,6 C9,4.34314575 10.3431458,3 12,3 Z" />
          <path d="M12,9 L12,21 M8,13 L16,13 M7,17 L17,17" />
        </svg>
      ),
    },
    {
      id: "machine",
      name: "Machine",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="12" y1="6" x2="12" y2="18" />
        </svg>
      ),
    },
    {
      id: "kettlebells",
      name: "Kettlebells",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M12,4 C14.7614237,4 17,6.23857625 17,9 L17,11 C17,14.3137085 14.3137085,17 11,17 L13,17 C16.3137085,17 19,14.3137085 19,11 L19,9 C19,5.13400675 15.8659932,2 12,2 C8.13400675,2 5,5.13400675 5,9 L5,11 C5,14.3137085 7.6862915,17 11,17 L11,17 C7.6862915,17 5,14.3137085 5,11 L5,9 C5,6.23857625 7.23857625,4 10,4 L12,4 Z" />
        </svg>
      ),
    },
    {
      id: "cables",
      name: "Cables",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M12,2 L12,22 M7,4 L17,4 M7,20 L17,20" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      id: "bands",
      name: "Band",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10"
        >
          <path d="M6,6 C10,12 14,12 18,6 M6,18 C10,12 14,12 18,18" />
        </svg>
      ),
    },
  ]

  const handleSelect = (equipmentId) => {
    if (equipmentId === "all") {
      // If "Select All" is clicked
      if (selectedEquipment.length === equipmentOptions.length - 1) {
        // If all are already selected, deselect all
        onChange([])
      } else {
        // Otherwise, select all except "all" itself
        onChange(equipmentOptions.filter((eq) => eq.id !== "all").map((eq) => eq.id))
      }
    } else {
      // Toggle individual equipment
      if (selectedEquipment.includes(equipmentId)) {
        onChange(selectedEquipment.filter((id) => id !== equipmentId))
      } else {
        onChange([...selectedEquipment, equipmentId])
      }
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {equipmentOptions.map((equipment) => (
        <motion.div
          key={equipment.id}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`relative bg-white rounded-lg shadow-sm border ${
            selectedEquipment.includes(equipment.id) ||
            (equipment.id === "all" && selectedEquipment.length === equipmentOptions.length - 1)
              ? "border-indigo-500"
              : "border-gray-200"
          } p-3 cursor-pointer flex flex-col items-center justify-center h-28 sm:h-32`}
          onClick={() => handleSelect(equipment.id)}
        >
          {(selectedEquipment.includes(equipment.id) ||
            (equipment.id === "all" && selectedEquipment.length === equipmentOptions.length - 1)) && (
            <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-0.5">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <div className="text-gray-600">{equipment.icon}</div>
          <div className="mt-2 text-center text-indigo-900 font-medium text-sm">{equipment.name}</div>
        </motion.div>
      ))}
    </div>
  )
}
