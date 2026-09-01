'use client';

import React, { useState } from 'react';
import { WorkoutSession } from '@/types/domain';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  History,
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface HistoryTabProps {
  sessions: WorkoutSession[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ sessions }) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const sortedSessions = [...sessions].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.startedAt || 0).getTime();
    const timeB = new Date(b.completedAt || b.startedAt || 0).getTime();
    return timeB - timeA;
  });

  const toggleExpand = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                Workout Session History
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Complete chronological log of all completed and recorded sessions
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {sessions.length} Recorded Sessions
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedSessions.length > 0 ? (
            sortedSessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              const dateStr = new Date(session.completedAt || session.startedAt).toISOString().split('T')[0];
              const durationMinutes = session.duration
                ? Math.round(session.duration / 60)
                : session.durationMinutes || 0;

              let performedSetsCount = 0;
              let totalVolumeKg = 0;

              (session.exercises || []).forEach((ex) => {
                if (ex.status === 'skipped') return;
                (ex.sets || []).forEach((s) => {
                  if (!s.deletedAt && (s.status === 'completed' || !s.status)) {
                    performedSetsCount += 1;
                    const w = s.actualWeight !== undefined ? s.actualWeight : (s.loadValue || 0);
                    const r = s.actualReps !== undefined ? s.actualReps : (s.targetReps || 0);
                    const u = s.weightUnit || 'kg';
                    if (w > 0 && r > 0) {
                      totalVolumeKg += (u === 'lbs' ? w * 0.45359237 : w) * r;
                    }
                  }
                });
              });

              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 overflow-hidden transition-all shadow-xs"
                >
                  {/* Session Header Bar */}
                  <div
                    onClick={() => toggleExpand(session.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {session.name || 'Workout Session'}
                        </h4>
                        {session.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : session.status === 'abandoned' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <XCircle className="w-3 h-3" /> Abandoned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {dateStr}
                        </span>
                        {durationMinutes > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {durationMinutes} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" /> {(session.exercises || []).length} exercises · {performedSetsCount} sets
                        </span>
                        {totalVolumeKg > 0 && (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {Math.round(totalVolumeKg).toLocaleString()} kg vol
                          </span>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Expandable Session Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                      {/* Exercise and Sets List */}
                      <div className="space-y-3">
                        {(session.exercises || []).map((ex, exIdx) => (
                          <div
                            key={ex.id || exIdx}
                            className="p-3 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                                {ex.name}
                              </h5>
                              <span className="text-[11px] text-slate-400 capitalize">
                                {ex.status}
                              </span>
                            </div>

                            {/* Sets Table */}
                            {(ex.sets || []).length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                {ex.sets.map((set, sIdx) => {
                                  const w = set.actualWeight !== undefined ? set.actualWeight : (set.loadValue || 0);
                                  const r = set.actualReps !== undefined ? set.actualReps : (set.targetReps || 0);
                                  const u = set.weightUnit || 'kg';

                                  return (
                                    <div
                                      key={set.id || sIdx}
                                      className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px]"
                                    >
                                      <div className="flex items-center justify-between text-slate-500">
                                        <span>Set {set.setNumber}</span>
                                        <span className="uppercase text-[9px] font-semibold">{set.type}</span>
                                      </div>
                                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                                        {w > 0 ? `${w} ${u} × ${r}` : `${r} reps (BW)`}
                                      </div>
                                      {set.rpe && (
                                        <div className="text-[10px] text-indigo-500">
                                          RPE {set.rpe}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">No sets logged</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Feedback Summary */}
                      {session.feedback && (
                        <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-semibold">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>Rating: {session.feedback.rating}/5</span>
                            {session.feedback.difficulty && (
                              <span className="capitalize text-slate-500">
                                · {session.feedback.difficulty}
                              </span>
                            )}
                          </div>
                          {session.feedback.notes && (
                            <span className="text-slate-600 dark:text-slate-400 italic">
                              "{session.feedback.notes}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No workout history found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
