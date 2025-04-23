"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, Trash2, Clock, Dumbbell, ChevronRight } from "lucide-react"
import { useFavorites } from "./favorites-context"

interface FavoritesViewProps {
  savedPlans: any[]
  onLoadPlan: (plan: any) => void
  onDeletePlan: (id: string) => void
}

export default function FavoritesView({ savedPlans, onLoadPlan, onDeletePlan }: FavoritesViewProps) {
  const { favorites } = useFavorites()
  const [filter, setFilter] = useState<string>("all")
  const cardStyle = "backdrop-filter backdrop-blur-lg bg-white/40 border border-white/50 shadow-xl"

  // Filter saved plans by favorites
  const favoritePlans = savedPlans.filter((plan) => favorites.includes(plan.id))

  // Filter plans based on selected filter
  const filteredPlans = filter === "favorites" ? favoritePlans : savedPlans

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle className="text-indigo-900">Your Workout Collection</CardTitle>
          <CardDescription className="text-indigo-700">Access your saved and favorite workout plans</CardDescription>
          <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Plans</TabsTrigger>
              <TabsTrigger value="favorites">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px] pr-4 -mr-4 overflow-y-auto">
            {filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-indigo-900 mb-1">
                  {filter === "favorites" ? "No favorite workouts yet" : "No saved workouts yet"}
                </h3>
                <p className="text-indigo-600">
                  {filter === "favorites"
                    ? "Click the heart icon on any workout to add it to your favorites."
                    : "Save your generated workouts to access them here."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-2">
                {filteredPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white/70 rounded-lg border border-indigo-100 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-indigo-900 flex items-center">
                            {plan.plan.difficulty
                              ? plan.plan.difficulty.charAt(0).toUpperCase() + plan.plan.difficulty.slice(1)
                              : "Custom"}{" "}
                            Workout
                            {favorites.includes(plan.id) && (
                              <Heart className="h-4 w-4 ml-2 fill-pink-500 text-pink-500" />
                            )}
                          </h3>
                          <p className="text-sm text-indigo-700">Saved on: {plan.date}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => onDeletePlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <div className="bg-indigo-50 text-indigo-700 rounded-md px-2 py-1 text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> {plan.plan.duration} min
                        </div>
                        <div className="bg-indigo-50 text-indigo-700 rounded-md px-2 py-1 text-xs flex items-center">
                          <Dumbbell className="h-3 w-3 mr-1" /> {plan.plan.exercises.length} exercises
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {plan.plan.muscleGroups?.map((group, index) => (
                          <span key={index} className="text-xs bg-purple-50 text-purple-700 rounded-full px-2 py-0.5">
                            {group}
                          </span>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => onLoadPlan(plan)}
                      >
                        Load Workout <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}
