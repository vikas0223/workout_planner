"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star } from "lucide-react"

interface StarRatingProps {
  onChange: (rating: number) => void
  value: number
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export default function StarRating({ onChange, value, size = "md", disabled = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  // Size mappings
  const sizeMap = {
    sm: { star: "w-4 h-4", container: "gap-1" },
    md: { star: "w-6 h-6", container: "gap-1.5" },
    lg: { star: "w-8 h-8", container: "gap-2" },
  }

  return (
    <div className={`flex items-center ${sizeMap[size].container}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          disabled={disabled}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`focus:outline-none ${disabled ? "cursor-default opacity-80" : "cursor-pointer"}`}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => !disabled && setHoverRating(0)}
          onClick={() => !disabled && onChange(star)}
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <Star
            className={`${sizeMap[size].star} transition-all duration-200 ${
              star <= (hoverRating || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        </motion.button>
      ))}
    </div>
  )
}
