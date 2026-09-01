"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, Star, Heart, CheckCircle } from "lucide-react"

interface InteractiveFeedbackProps {
  onSubmit: (rating: number, feedback: string) => void
  workoutName?: string
}

export default function InteractiveFeedback({ onSubmit, workoutName = "workout" }: InteractiveFeedbackProps) {
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [animation, setAnimation] = useState("")

  const handleSubmit = () => {
    setIsSubmitted(true)
    setAnimation("submitted")
    onSubmit(rating, feedback)
  }

  const getEmotionLabel = () => {
    if (rating === 0) return "Select a rating"
    if (rating === 1) return "Very Unsatisfied"
    if (rating === 2) return "Unsatisfied"
    if (rating === 3) return "Neutral"
    if (rating === 4) return "Satisfied"
    return "Very Satisfied"
  }

  const getEmotionColor = () => {
    if (rating === 0) return "text-gray-400"
    if (rating <= 2) return "text-red-500"
    if (rating === 3) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <Card className="backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="p-3 sm:p-4 md:p-5 text-center">
        <CardTitle className="text-lg sm:text-xl md:text-2xl text-indigo-900">How was your experience?</CardTitle>
        <CardDescription className="text-indigo-700 mt-1">
          Your feedback helps us improve your recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-5">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="feedback-form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <div className="flex items-center justify-center space-x-0.5 sm:space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setRating(star)
                        setAnimation("pulse")
                        setTimeout(() => setAnimation(""), 300)
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="relative p-1 focus:outline-none transition-all duration-300"
                      aria-label={`Rate ${star} out of 5 stars`}
                    >
                      <Star
                        className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-colors duration-300 ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-md"
                            : "text-gray-300 hover:text-gray-400"
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                <motion.p
                  animate={animation === "pulse" ? { scale: [1, 1.1, 1] } : {}}
                  className={`font-medium text-sm sm:text-base md:text-lg ${getEmotionColor()}`}
                >
                  {getEmotionLabel()}
                </motion.p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center">
                  <p className="text-sm font-medium text-indigo-900">Additional Comments</p>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFeedback(feedback + "Too difficult. ")}
                      className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-300"
                    >
                      Too difficult
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFeedback(feedback + "Too easy. ")}
                      className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-300"
                    >
                      Too easy
                    </motion.button>
                  </div>
                </div>
                <Textarea
                  placeholder="Tell us what you liked or how we can improve your experience..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] bg-white/50 border-indigo-200 resize-none transition-all duration-300 focus:border-indigo-400"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-400 transition-all duration-300"
                    onClick={() => {
                      setRating(1)
                      setFeedback(feedback + "I didn't like this experience. ")
                    }}
                    aria-label="Rate as dislike"
                  >
                    <ThumbsDown className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <span className="text-xs mt-1 text-red-500">Dislike</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-pink-300 text-pink-500 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-400 transition-all duration-300"
                    onClick={() => {
                      setRating(5)
                      setFeedback(feedback + "I loved this experience! ")
                    }}
                    aria-label="Rate as love it"
                  >
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <span className="text-xs mt-1 text-pink-500">Love it</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-green-300 text-green-500 hover:bg-green-50 hover:text-green-600 hover:border-green-400 transition-all duration-300"
                    onClick={() => {
                      setRating(4)
                      setFeedback(feedback + "Good experience! ")
                    }}
                    aria-label="Rate as like"
                  >
                    <ThumbsUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <span className="text-xs mt-1 text-green-500">Like</span>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="feedback-success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6 sm:py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="mx-auto mb-4 bg-green-100 rounded-full p-2 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center"
              >
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
                <h3 className="text-lg sm:text-xl font-medium text-indigo-900 mb-2">
                  {rating >= 4
                    ? "Thank you for your valuable feedback!"
                    : "Thanks for your feedback! We will strive to improve."}
                </h3>
                <p className="text-indigo-700">Your input helps us create better recommendations for you.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      {!isSubmitted && (
        <CardFooter className="p-3 sm:p-4 md:p-5">
          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] font-medium py-2"
          >
            Submit Feedback
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
