"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ThumbsUp, Loader2 } from "lucide-react"
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
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (rating === 0) return

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSubmit({ rating, feedback, difficulty })

      // Show appropriate toast based on rating
      if (rating >= 4) {
        toast({
          title: "Thanks for your feedback! 👍",
          description: "We're glad you enjoyed the experience.",
          variant: "success",
        })
      } else {
        toast({
          title: "Thanks for your feedback! ✅",
          description: "We'll work on improving your experience.",
          variant: "default",
        })
      }

      // Reset form
      setRating(0)
      setFeedback("")
      setDifficulty("")

      // Close the form
      onClose()
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
    <Card className="backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-center text-indigo-900">How was your {workoutName}?</CardTitle>
        <CardDescription className="text-center text-indigo-700">
          Your feedback helps us improve your recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="space-y-2">
          <Label htmlFor="feedback" className="text-sm font-medium text-indigo-900">
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="feedback"
            placeholder="Tell us what you liked or how we can improve..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px] bg-white/50 border-indigo-200 resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-indigo-900">How was the difficulty level?</Label>
          <RadioGroup value={difficulty} onValueChange={setDifficulty} disabled={isSubmitting}>
            <div className="flex flex-wrap gap-4">
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
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-indigo-300 text-indigo-700"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
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
    </Card>
  )
}
