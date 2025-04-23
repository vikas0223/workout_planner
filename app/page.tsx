import { Card, CardContent } from "@/components/ui/card"
import WorkoutPlanner from "@/components/workout-planner"

export default function Home() {
  return (
    <main className="bg-gradient-to-br from-indigo-200 via-purple-200 to-indigo-300 text-slate-800 py-12 px-4 min-h-screen flex items-center justify-center">
      <div className="container max-w-3xl mx-auto">
        <Card className="backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-indigo-900">Personalized Workout Planner</h1>
              <p className="text-xl text-indigo-700 max-w-2xl mx-auto">
                Create your custom workout plan based on your goals and preferences
              </p>
            </div>
            <div className="mt-8">
              <WorkoutPlanner />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
