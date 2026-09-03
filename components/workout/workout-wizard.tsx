/**
 * Workout Generation Questionnaire Wizard Component
 * 
 * Sequential one-question-at-a-time onboarding interface for deterministic workout generation.
 * Minimal required inputs, canonical taxonomy, and clean progress navigation.
 */

'use client';

import React, { useState } from 'react';
import { FitnessGoal, ExperienceLevel, GeneratedWorkout } from '@/types/domain';
import { WorkoutEngine, WorkoutEngineInput } from '@/features/workout-engine';
import { CANONICAL_GOALS, EXPERIENCE_LEVELS } from '@/lib/domain/workout-draft';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Dumbbell,
  Target,
  Clock,
  Flame,
  Calendar,
  Layers,
  Check,
  Building,
  Home as HomeIcon,
} from 'lucide-react';

export interface WorkoutWizardProps {
  onWorkoutGenerated: (workout: GeneratedWorkout) => void;
  onCancel?: () => void;
}

const EQUIPMENT_LIST = [
  'Dumbbells',
  'Barbell',
  'Bodyweight',
  'Cables',
  'Machines',
  'Kettlebells',
  'Resistance Bands',
  'Pull-up Bar',
  'Bench',
];

const MUSCLE_FOCUS_OPTIONS = [
  { id: 'Full Body', label: 'Full Body', description: 'Complete balanced head-to-toe stimulus' },
  { id: 'Push', label: 'Push Focus', description: 'Chest, Front Shoulders, and Triceps' },
  { id: 'Pull', label: 'Pull Focus', description: 'Upper Back, Lats, Rear Delts, and Biceps' },
  { id: 'Legs', label: 'Legs & Lower Body', description: 'Quads, Hamstrings, Glutes, and Calves' },
  { id: 'Upper Body', label: 'Upper Body', description: 'Chest, Back, Shoulders, and Arms' },
  { id: 'Core', label: 'Core & Abs', description: 'Abdominals, Obliques, and Stability' },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90];

export function WorkoutWizard({ onWorkoutGenerated, onCancel }: WorkoutWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Form State with canonical defaults
  const [goal, setGoal] = useState<FitnessGoal>('hypertrophy');
  const [experience, setExperience] = useState<ExperienceLevel>('intermediate');
  const [location, setLocation] = useState<'gym' | 'home'>('gym');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Dumbbells',
    'Barbell',
    'Bodyweight',
    'Bench',
  ]);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [duration, setDuration] = useState<number>(45);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(['Full Body']);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const toggleMuscle = (muscle: string) => {
    if (muscle === 'Full Body') {
      setSelectedMuscles(['Full Body']);
      return;
    }
    const filtered = selectedMuscles.filter((m) => m !== 'Full Body');
    if (filtered.includes(muscle)) {
      const remaining = filtered.filter((m) => m !== muscle);
      setSelectedMuscles(remaining.length > 0 ? remaining : ['Full Body']);
    } else {
      setSelectedMuscles([...filtered, muscle]);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);

    try {
      const input: WorkoutEngineInput = {
        name: `${CANONICAL_GOALS.find((g) => g.value === goal)?.label.split(' ')[0] || 'Custom'} ${selectedMuscles[0]} Routine`,
        fitnessLevel: experience,
        primaryGoal: goal,
        targetMuscles: selectedMuscles,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : ['bodyweight'],
        durationMinutes: duration,
        daysPerWeek: daysPerWeek,
        seed: Date.now(),
      };

      const plan = WorkoutEngine.generateWorkoutPlan(input);
      setIsGenerating(false);
      onWorkoutGenerated(plan);
    } catch (err) {
      console.error('Error generating workout plan:', err);
      setIsGenerating(false);
    }
  };

  const remainingSteps = totalSteps - currentStep;
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-md overflow-hidden p-6 sm:p-8">
      {/* Header & Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>STEP {currentStep} OF {totalSteps} • {remainingSteps} steps remaining</span>
          <span className="text-indigo-600 font-semibold">{Math.round(progressPercentage)}% Completed</span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-slate-100" aria-label={`Workout setup progress (${remainingSteps} steps remaining)`} />
      </div>

      {/* Step Content */}
      <div className="min-h-[340px] flex flex-col justify-between">
        {/* Step 1: Goal */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-600" />
                What is your primary fitness goal?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your goal drives exercise selection, rep ranges, and rest intervals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {CANONICAL_GOALS.map((g) => {
                const isSelected = goal === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{g.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{g.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Experience */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Flame className="w-6 h-6 text-indigo-600" />
                What is your training experience?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Calibrates exercise complexity and volume to prevent overtraining.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const isSelected = experience === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setExperience(lvl.value)}
                    className={`w-full p-4 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900">{lvl.label}</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lvl.value === 'beginner'
                          ? 'Fundamental movement patterns, motor learning, and foundation building.'
                          : lvl.value === 'intermediate'
                          ? 'Progressive overload, varied compound lifts, and periodization.'
                          : 'High-intensity volume, advanced variations, and specialization.'}
                      </p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-indigo-600 shrink-0 ml-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Location & Equipment */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-indigo-600" />
                Where and with what will you train?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your environment and all available equipment.
              </p>
            </div>

            {/* Location Toggle */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setLocation('gym');
                  setSelectedEquipment(['Dumbbells', 'Barbell', 'Cables', 'Machines', 'Bench', 'Bodyweight']);
                }}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  location === 'gym'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4" />
                Commercial Gym
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocation('home');
                  setSelectedEquipment(['Dumbbells', 'Bodyweight', 'Resistance Bands']);
                }}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  location === 'home'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <HomeIcon className="w-4 h-4" />
                Home / Limited
              </button>
            </div>

            {/* Equipment Chips */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-700 mb-2 block">Available Equipment:</span>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_LIST.map((eq) => {
                  const isSelected = selectedEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Days per Week */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-600" />
                How many days per week do you plan to train?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Helps configure appropriate weekly split density.
              </p>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-4">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isSelected = daysPerWeek === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDaysPerWeek(num)}
                    className={`py-4 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white font-black shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-800 font-bold hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg block">{num}</span>
                    <span className="text-[10px] uppercase font-semibold opacity-80">
                      {num === 1 ? 'day' : 'days'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-slate-500 pt-2">
              Recommended for your goal: <strong className="text-slate-800">3 to 4 days</strong> per week.
            </p>
          </div>
        )}

        {/* Step 5: Duration */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-600" />
                Target workout duration
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sets the overall exercise count and density of your session.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-3">
              {DURATION_PRESETS.map((mins) => {
                const isSelected = duration === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-sm'
                        : 'border-slate-200 text-slate-800 font-semibold hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base block">{mins}</span>
                    <span className="text-[10px] uppercase">min</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-xs text-slate-600 mt-4">
              Estimated structure: <strong className="text-slate-900">{Math.round(duration / 9)} compound/isolation exercises</strong> with warm-up and cool-down intervals.
            </div>
          </div>
        )}

        {/* Step 6: Target Muscle Focus */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-6 h-6 text-indigo-600" />
                Select muscle groups to target
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choose Full Body or select specific focal splits for this session.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {MUSCLE_FOCUS_OPTIONS.map((opt) => {
                const isSelected = selectedMuscles.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMuscle(opt.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="border-slate-200 text-xs text-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 px-5"
          >
            {currentStep === totalSteps ? (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {isGenerating ? 'Generating Plan...' : 'Generate Workout'}
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
