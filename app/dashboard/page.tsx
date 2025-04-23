"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import EnhancedDashboard from "@/components/enhanced-dashboard"
import type { UserProfile } from "@/lib/recommendation-engine"
import { FavoritesProvider } from "@/components/favorites-context"
import { WorkoutCompletionProvider, useWorkoutCompletion } from "@/contexts/workout-completion-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

function DashboardContent() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const router = useRouter()
  const { isOfflineMode } = useWorkoutCompletion()

  useEffect(() => {
    // Load user profile from localStorage
    const savedUserProfile = localStorage.getItem("userProfile")
    if (savedUserProfile) {
      setUserProfile(JSON.parse(savedUserProfile))
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-200 p-4 py-8 rounded-xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center">
          <Button variant="outline" className="mr-4 border-indigo-300 text-indigo-700" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-indigo-900">Your Fitness Dashboard</h1>
        </div>
        <Button
          onClick={() => router.push("/")}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
        >
          Generate New Workout
        </Button>
      </div>

      {isOfflineMode && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-800">Offline Mode</AlertTitle>
          <AlertDescription className="text-amber-700">
            You're currently in offline mode. Your data is being stored locally and will not sync with the server.
          </AlertDescription>
        </Alert>
      )}

      {userProfile ? (
        <EnhancedDashboard userProfile={userProfile} />
      ) : (
        <Card className="backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-indigo-900">No Workout Data</CardTitle>
            <CardDescription className="text-indigo-700">
              Complete workouts to see your progress dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-600">
              Your dashboard will populate once you've completed and saved workouts. Get started with your personalized
              plan today!
            </p>
            <Button
              className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              onClick={() => router.push("/")}
            >
              Create a Workout Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <WorkoutCompletionProvider>
      <FavoritesProvider>
        <DashboardContent />
      </FavoritesProvider>
    </WorkoutCompletionProvider>
  )
}
