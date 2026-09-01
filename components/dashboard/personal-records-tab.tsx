'use client';

import React, { useState } from 'react';
import { ExercisePersonalRecords } from '@/lib/domain/personal-records';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trophy, Search, Dumbbell, Award, Flame, Calendar } from 'lucide-react';

interface PersonalRecordsTabProps {
  personalRecords: Record<string, ExercisePersonalRecords>;
}

export const PersonalRecordsTab: React.FC<PersonalRecordsTabProps> = ({ personalRecords }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const prList = Object.values(personalRecords).sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName)
  );

  const filteredPRs = prList.filter((pr) =>
    pr.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Personal Records (PRs)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Derived directly from completed sets in canonical workout sessions
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search exercise PRs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPRs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPRs.map((pr) => (
                <div
                  key={pr.exerciseId}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs space-y-3"
                >
                  {/* Exercise Name & Metadata */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {pr.exerciseName}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pr.totalSetsLogged} sets · {pr.totalRepsLogged} reps logged
                      </p>
                    </div>
                    {pr.lastTrainedAt && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(pr.lastTrainedAt).toISOString().split('T')[0]}
                      </span>
                    )}
                  </div>

                  {/* PR Metric Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Max Weight */}
                    {pr.maxWeight && (
                      <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                        <div className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" /> Max Weight
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                          {pr.maxWeight.value} {pr.maxWeight.unit}
                          <span className="text-[10px] font-normal text-slate-500 ml-1">
                            ({pr.maxWeight.reps} reps)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Estimated 1RM */}
                    {pr.estimated1RM && (
                      <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
                        <div className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Award className="w-3 h-3" /> Estimated 1RM
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                          {pr.estimated1RM.value} {pr.estimated1RM.unit}
                          <span className="text-[10px] font-normal text-slate-500 ml-1">
                            (Epley)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Max Reps */}
                    {pr.maxReps && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                        <div className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Max Reps
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                          {pr.maxReps.reps} reps
                          {pr.maxReps.weight > 0 && (
                            <span className="text-[10px] font-normal text-slate-500 ml-1">
                              (@ {pr.maxReps.weight} {pr.maxReps.unit})
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Max Set Volume */}
                    {pr.maxSetVolume && (
                      <div className="p-2.5 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60">
                        <div className="text-[10px] font-semibold uppercase text-sky-600 dark:text-sky-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Best Set Vol
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                          {pr.maxSetVolume.value.toLocaleString()} {pr.maxSetVolume.unit}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {searchQuery
                ? 'No exercises match your search.'
                : 'No personal records recorded yet. Complete workouts to set your PRs!'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
