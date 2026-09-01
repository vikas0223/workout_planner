'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Dumbbell, Compass, ArrowRight, Trophy } from 'lucide-react';

interface DashboardEmptyStateProps {
  onGenerateWorkout: () => void;
  onBuildRoutine: () => void;
  onExploreExercises: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  onGenerateWorkout,
  onBuildRoutine,
  onExploreExercises,
}) => {
  return (
    <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden shadow-sm">
      <CardContent className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6">
        {/* Graphic Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Trophy className="w-8 h-8" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your Progress Starts Here
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Complete your first workout session to unlock intelligent volume tracking,
            streak analytics, muscle distribution insights, and personal records.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={onGenerateWorkout}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Workout Plan
          </Button>

          <Button
            variant="outline"
            onClick={onBuildRoutine}
            className="w-full sm:w-auto border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Dumbbell className="w-4 h-4" />
            Build Custom Routine
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExploreExercises}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold inline-flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            Browse Exercise Library & Anatomy
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
