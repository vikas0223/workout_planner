"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ThumbsUp, Loader2, CheckCircle } from "lucide-react"
import StarRating from "./star-rating"
import { useToast } from "@/hooks/use-toast"

interface WorkoutFeedbackFormProps {
  onSubmit: (data: { rating: number; feedback: string; difficulty: string }) => void
  onClose: () => void
  workoutName?: string
}

export default function WorkoutFeedbackForm({ onSubmit, onClose, workoutName = "workout" }: WorkoutFeedbackFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [thankYouMessage, setThankYouMessage] = useState("")
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (rating === 0) return

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSubmit({ rating, feedback, difficulty })

      // Set thank you message based on rating
      if (rating >= 4) {
        setThankYouMessage("Thank you for your valuable feedback!")
      } else {
        setThankYouMessage("Thanks for your feedback! We will strive to improve.")
      }

      // Show appropriate toast based on rating
      if (rating >= 4) {
        toast({
          title: "Thank you for your feedback!",
          description: "We're glad you enjoyed the experience.",
          variant: "default",
        })
      } else {
        toast({
          title: "Thank you for your feedback!",
          description: "We'll work to improve your experience.",
          variant: "default",
        })
      }

      // Set submitted state
      setIsSubmitted(true)

      // After a delay, reset and close
      setTimeout(() => {
        // Reset form
        setRating(0)
        setFeedback("")
        setDifficulty("")
        setIsSubmitted(false)

        // Close the form
        onClose()
      }, 2000)
    } catch (error) {
      toast({
        title: "Error submitting feedback",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="p-3 sm:p-4 md:p-5 text-center">
        <CardTitle className="text-lg sm:text-xl md:text-2xl text-indigo-900">How was your experience?</CardTitle>
        <CardDescription className="text-indigo-700 mt-1">
          Your feedback helps us improve your recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-5">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="thank-you"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-lg sm:text-xl font-medium text-indigo-900 mb-2"
              >
                {thankYouMessage}
              </motion.h3>
            </motion.div>
          ) : (
            <motion.div key="feedback-form" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col items-center space-y-3">
                <p className="text-sm font-medium text-indigo-900">Rate your experience</p>
                <StarRating value={rating} onChange={setRating} size="lg" disabled={isSubmitting} />
                <AnimatePresence>
                  {rating > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`text-sm font-medium ${
                        rating >= 4 ? "text-green-600" : rating === 3 ? "text-yellow-600" : "text-red-600"
                      }`}
                    >
                      {rating === 5
                        ? "Excellent!"
                        : rating === 4
                          ? "Very Good!"
                          : rating === 3
                            ? "Good"
                            : rating === 2
                              ? "Fair"
                              : "Poor"}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2 mt-4 sm:mt-6">
                <Label htmlFor="feedback" className="text-sm font-medium text-indigo-900">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us what you liked or how we can improve your experience..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] bg-white/50 border-indigo-200 resize-none transition-all duration-300 focus:border-indigo-400"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2 mt-4 sm:mt-6">
                <Label className="text-sm font-medium text-indigo-900">How was the difficulty level?</Label>
                <RadioGroup value={difficulty} onValueChange={setDifficulty} disabled={isSubmitting}>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="too-easy" id="too-easy" />
                      <Label htmlFor="too-easy" className="text-sm">
                        Too Easy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="just-right" id="just-right" />
                      <Label htmlFor="just-right" className="text-sm">
                        Just Right
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="too-hard" id="too-hard" />
                      <Label htmlFor="too-hard" className="text-sm">
                        Too Hard
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      {!isSubmitted && (
        <CardFooter className="flex flex-col sm:flex-row justify-between p-3 sm:p-4 md:p-5 gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-300"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ThumbsUp className="mr-2 h-4 w-4" />
                Submit Feedback
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
