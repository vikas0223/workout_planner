/**
 * Workout Completion View Component
 * 
 * Celebration and summary screen after completing a workout session.
 * Collects WorkoutFeedback (rating, difficulty, tags, notes) and supports
 * saving the completed session as a reusable WorkoutTemplate.
 */

'use client';

import React, { useState } from 'react';
import { WorkoutSession, WorkoutFeedback, WorkoutTemplate } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Trophy,
  Star,
  Clock,
  Dumbbell,
  CheckCircle2,
  Bookmark,
  Home,
  Sparkles,
  Flame,
} from 'lucide-react';

export interface WorkoutCompletionViewProps {
  session: WorkoutSession;
  onSubmitFeedback: (feedback: {
    rating: number;
    difficulty: 'too_easy' | 'just_right' | 'too_hard';
    tags: string[];
    notes?: string;
  }) => Promise<void>;
  onSaveAsTemplate: (session: WorkoutSession) => Promise<void>;
  onReturnHome: () => void;
  isSavingTemplate?: boolean;
}

const FEEDBACK_TAGS = [
  { id: 'too_long', label: 'Too Long' },
  { id: 'too_short', label: 'Too Short' },
  { id: 'too_hard', label: 'Too Intense' },
  { id: 'too_easy', label: 'Too Easy' },
  { id: 'repetitive', label: 'Repetitive Movements' },
  { id: 'equipment_mismatch', label: 'Equipment Issue' },
  { id: 'great_pump', label: 'Great Pump / Energy' },
];

export function WorkoutCompletionView({
  session,
  onSubmitFeedback,
  onSaveAsTemplate,
  onReturnHome,
  isSavingTemplate,
}: WorkoutCompletionViewProps) {
  const [rating, setRating] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'too_easy' | 'just_right' | 'too_hard'>('just_right');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Compute summary stats
  const totalSetsLogged = session.exercises.reduce(
    (acc, ex) => acc + (ex.sets?.length || 0),
    0
  );
  const completedExercisesCount = session.exercises.filter(
    (ex) => ex.status === 'completed'
  ).length;

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleFeedbackSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitFeedback({
        rating,
        difficulty,
        tags: selectedTags,
        notes: notes.trim() || undefined,
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Top Celebration Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
        <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 text-white shadow-inner">
          <Trophy className="w-9 h-9 text-amber-300" />
        </div>

        <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-200 block mb-1">
          Workout Complete
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{session.name}</h2>
        <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-sm mx-auto">
          Great job! Your performance data has been persisted locally and queued for synchronization.
        </p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-white/20">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <Clock className="w-4 h-4 mx-auto text-emerald-200 mb-1" />
            <span className="text-[10px] uppercase font-semibold text-emerald-200 block">Duration</span>
            <span className="text-base font-black">{session.durationMinutes || 45} mins</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <Dumbbell className="w-4 h-4 mx-auto text-emerald-200 mb-1" />
            <span className="text-[10px] uppercase font-semibold text-emerald-200 block">Sets Logged</span>
            <span className="text-base font-black">{totalSetsLogged} Sets</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-200 mb-1" />
            <span className="text-[10px] uppercase font-semibold text-emerald-200 block">Exercises</span>
            <span className="text-base font-black">
              {completedExercisesCount} / {session.exercises.length}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">How was your workout?</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your rating calibrates future session intensity and exercise recommendations.
          </p>
        </div>

        {/* 1. Star Rating */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Overall Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 text-slate-200 hover:text-amber-400 transition-colors"
                aria-label={`Rate ${star} star`}
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 2. Difficulty Rating */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Perceived Exertion
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'too_easy', label: 'Too Easy' },
              { id: 'just_right', label: 'Just Right' },
              { id: 'too_hard', label: 'Too Hard' },
            ].map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id as any)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Feedback Tags */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FEEDBACK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Notes */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Additional Session Notes
          </label>
          <Input
            type="text"
            placeholder="e.g. Felt strong on bench, slight shoulder tightness"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-10 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

        {/* Feedback Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSavingTemplate}
            onClick={() => onSaveAsTemplate(session)}
            className="w-full sm:w-auto text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1" />
            Save as Reusable Template
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || feedbackSubmitted}
            onClick={feedbackSubmitted ? onReturnHome : handleFeedbackSubmit}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs px-5"
          >
            {feedbackSubmitted ? (
              <>
                <Home className="w-3.5 h-3.5 mr-1.5" />
                Return to Hub
              </>
            ) : isSubmitting ? (
              'Submitting...'
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
