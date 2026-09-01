/**
 * Workout Hub Container Component
 * 
 * Top-level coordinator managing the workout lifecycle:
 * - Wizard (Deterministic Generation)
 * - Review (Generated Plan Overview)
 * - Builder (Manual creation & Generated plan editing)
 * - Session (Live set-by-set execution)
 * - Completion (Summary & Feedback)
 * - Saved (Offline Templates Library)
 * 
 * Supports session reconstruction across browser refresh and offline execution.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  GeneratedWorkout,
  WorkoutTemplate,
  WorkoutSession,
  WorkoutFeedback,
} from '@/types/domain';
import {
  WorkoutDraft,
  generatedWorkoutToDraft,
  templateToDraft,
  createEmptyWorkoutDraft,
  draftToWorkoutTemplate,
} from '@/lib/domain/workout-draft';
import { WorkoutWizard } from './workout-wizard';
import { WorkoutReview } from './workout-review';
import { WorkoutBuilder } from './workout-builder';
import { WorkoutSessionView } from './workout-session-view';
import { WorkoutCompletionView } from './workout-completion-view';
import { SavedWorkoutsList } from './saved-workouts-list';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import { LocalWorkoutRepository } from '@/lib/repositories/local/local-workout-repository';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Pencil,
  Bookmark,
  Flame,
  Check,
} from 'lucide-react';
import { generateId } from '@/lib/utils/id';

export type WorkoutHubView =
  | 'wizard'
  | 'review'
  | 'builder'
  | 'session'
  | 'completed'
  | 'saved';

export function WorkoutHub() {
  const [sessionService] = useState(() => new SessionCommandService());
  const [workoutRepo] = useState(() => new LocalWorkoutRepository());
  const [completionRepo] = useState(() => new LocalCompletionRepository());

  const [activeView, setActiveView] = useState<WorkoutHubView>('wizard');
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [workoutDraft, setWorkoutDraft] = useState<WorkoutDraft | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reconstruct active session on mount if one is in progress
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const active = await sessionService.getActiveSession('guest_user');
        if (active && active.status === 'active') {
          setActiveSessionId(active.id);
          setActiveView('session');
        }
      } catch (err) {
        console.warn('Failed to check active session on mount:', err);
      }
    }
    checkActiveSession();
  }, [sessionService]);

  // 1. Wizard -> Generation complete
  const handleWorkoutGenerated = (workout: GeneratedWorkout) => {
    setGeneratedWorkout(workout);
    setActiveView('review');
  };

  // 2. Review -> Start Generated Workout
  const handleStartFromGenerated = async (workout: GeneratedWorkout) => {
    try {
      const session = await sessionService.startSession({
        name: workout.name,
        workout,
        userId: 'guest_user',
      });

      setActiveSessionId(session.id);
      setActiveView('session');
      showToast(`Started "${workout.name}"`);
    } catch (err: any) {
      console.error('Failed to start session from generated workout:', err);
      showToast(err?.message || 'Failed to start workout');
    }
  };

  // 3. Review -> Edit in Builder
  const handleEditFromGenerated = (workout: GeneratedWorkout) => {
    const draft = generatedWorkoutToDraft(workout);
    setWorkoutDraft(draft);
    setActiveView('builder');
  };

  // 4. Review / Builder -> Save as Template
  const handleSaveTemplate = async (template: WorkoutTemplate) => {
    setIsSaving(true);
    try {
      await workoutRepo.saveTemplate(template);
      setIsSaving(false);
      showToast(`Saved "${template.name}" template to your library`);
      setActiveView('saved');
    } catch (err: any) {
      setIsSaving(false);
      console.error('Failed to save template:', err);
      showToast('Failed to save workout template');
    }
  };

  // 5. Builder -> Start Workout from Draft
  const handleStartFromDraft = async (draft: WorkoutDraft) => {
    try {
      const template = draftToWorkoutTemplate(draft, 'guest_user');
      const session = await sessionService.startSession({
        name: draft.name,
        workout: template,
        templateId: template.id,
        userId: 'guest_user',
      });

      setActiveSessionId(session.id);
      setActiveView('session');
      showToast(`Started "${draft.name}"`);
    } catch (err: any) {
      console.error('Failed to start session from draft:', err);
      showToast(err?.message || 'Failed to start workout');
    }
  };

  // 6. Saved -> Start Workout from Template
  const handleStartFromTemplate = async (template: WorkoutTemplate) => {
    try {
      const session = await sessionService.startSession({
        name: template.name,
        workout: template,
        templateId: template.id,
        userId: 'guest_user',
      });

      setActiveSessionId(session.id);
      setActiveView('session');
      showToast(`Started "${template.name}"`);
    } catch (err: any) {
      console.error('Failed to start session from template:', err);
      showToast(err?.message || 'Failed to start workout');
    }
  };

  // 7. Saved -> Edit Template
  const handleEditTemplate = (template: WorkoutTemplate) => {
    const draft = templateToDraft(template);
    setWorkoutDraft(draft);
    setActiveView('builder');
  };

  // 8. Session -> Session Complete
  const handleSessionCompleted = (session: WorkoutSession) => {
    setCompletedSession(session);
    setActiveSessionId(null);
    setActiveView('completed');
  };

  // 9. Completion -> Submit Feedback
  const handleSubmitFeedback = async (
    feedbackData: {
      rating: number;
      difficulty: 'too_easy' | 'just_right' | 'too_hard';
      tags: string[];
      notes?: string;
    }
  ) => {
    if (!completedSession) return;
    const now = new Date().toISOString();
    const feedback: WorkoutFeedback = {
      id: generateId(),
      sessionId: completedSession.id,
      rating: feedbackData.rating,
      perceivedDifficulty: feedbackData.difficulty,
      difficulty: feedbackData.difficulty,
      tags: feedbackData.tags,
      notes: feedbackData.notes,
      comments: feedbackData.notes,
      createdAt: now,
    };

    await completionRepo.saveFeedback(feedback);
    showToast('Feedback recorded. Great workout!');
  };

  // 10. Completion -> Save Completed as Template
  const handleSaveCompletedAsTemplate = async (session: WorkoutSession) => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const template: WorkoutTemplate = {
        id: generateId(),
        userId: 'guest_user',
        name: `${session.name} (Template)`,
        goal: 'hypertrophy',
        difficulty: 'intermediate',
        duration: session.durationMinutes || 45,
        targetMuscles: ['Full Body'],
        equipment: ['Dumbbells', 'Bodyweight'],
        exercises: session.exercises.map((ex, idx) => ({
          id: generateId(),
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.plannedSets || 3,
          reps: String(ex.plannedReps || '8-12'),
          rest: ex.plannedRestSeconds ? `${ex.plannedRestSeconds}s` : '90s',
          targetMuscles: ['Full Body'],
          equipment: ['Dumbbells'],
          order: idx,
        })),
        isFavorite: false,
        isCustom: true,
        createdAt: now,
        updatedAt: now,
      };

      await workoutRepo.saveTemplate(template);
      setIsSaving(false);
      showToast(`Saved "${template.name}" as template`);
    } catch (err) {
      setIsSaving(false);
      console.error('Failed to save completed session as template:', err);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs text-white shadow-xl animate-in slide-in-from-bottom-3 duration-300"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Hub Navigation Bar */}
      <div className="flex items-center justify-between p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveView('wizard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'wizard' || activeView === 'review'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Plan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkoutDraft(createEmptyWorkoutDraft());
              setActiveView('builder');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'builder'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Custom Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('saved')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'saved'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Routines</span>
          </button>
        </div>

        {/* Active Session Indicator Button */}
        {activeSessionId && (
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveView('session')}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <Flame className="w-3.5 h-3.5 mr-1 text-amber-300" />
            Resume Active Workout
          </Button>
        )}
      </div>

      {/* Main Hub View Router */}
      <div className="min-h-[400px]">
        {activeView === 'wizard' && (
          <WorkoutWizard
            onWorkoutGenerated={handleWorkoutGenerated}
            onCancel={() => setActiveView('saved')}
          />
        )}

        {activeView === 'review' && generatedWorkout && (
          <WorkoutReview
            workout={generatedWorkout}
            onStart={handleStartFromGenerated}
            onEdit={handleEditFromGenerated}
            onSaveTemplate={(gw) => {
              const draft = generatedWorkoutToDraft(gw);
              const tpl = templateToDraft(draft as any);
              handleSaveTemplate(tpl as any);
            }}
            onRegenerate={() => setActiveView('wizard')}
            isSaving={isSaving}
          />
        )}

        {activeView === 'builder' && (
          <WorkoutBuilder
            initialDraft={workoutDraft || createEmptyWorkoutDraft()}
            onSaveTemplate={handleSaveTemplate}
            onStartSession={handleStartFromDraft}
            onCancel={() => setActiveView('saved')}
            isSaving={isSaving}
          />
        )}

        {activeView === 'session' && (
          <WorkoutSessionView
            initialSessionId={activeSessionId || undefined}
            onSessionCompleted={handleSessionCompleted}
            onAbandon={() => {
              setActiveSessionId(null);
              setActiveView('saved');
            }}
          />
        )}

        {activeView === 'completed' && completedSession && (
          <WorkoutCompletionView
            session={completedSession}
            onSubmitFeedback={handleSubmitFeedback}
            onSaveAsTemplate={handleSaveCompletedAsTemplate}
            onReturnHome={() => setActiveView('saved')}
            isSavingTemplate={isSaving}
          />
        )}

        {activeView === 'saved' && (
          <SavedWorkoutsList
            onStartWorkout={handleStartFromTemplate}
            onEditWorkout={handleEditTemplate}
            onCreateNew={() => {
              setWorkoutDraft(createEmptyWorkoutDraft());
              setActiveView('builder');
            }}
            onGenerateNew={() => setActiveView('wizard')}
          />
        )}
      </div>
    </div>
  );
}
