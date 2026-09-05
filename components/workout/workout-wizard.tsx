/**
 * Workout Generation Questionnaire Wizard Component (Part C & D)
 * 
 * Sequential one-question-at-a-time onboarding interface for deterministic workout generation.
 * Follows systematic spacing scale:
 * - Wizard top padding: 40px
 * - Progress -> heading: 28px
 * - Heading -> description: 8px
 * - Description -> options: 28px
 * - Option grid gap: 16px
 * - Options -> divider: 28px
 * - Divider -> footer buttons: 24px
 * 
 * Two-column desktop (1fr 1fr), single column mobile.
 * Option cards: min-h 116px, padding 20px, consistent layout, >=44px touch targets.
 */

'use client';

import React, { useState } from 'react';
import { FitnessGoal, ExperienceLevel, GeneratedWorkout } from '@/types/domain';
import { WorkoutEngine, WorkoutEngineInput } from '@/features/workout-engine';
import { CANONICAL_GOALS, EXPERIENCE_LEVELS } from '@/lib/domain/workout-draft';
import { Button } from '@/components/ui/button';
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
import { useAuthGuard } from '@/contexts/auth-guard-context';

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
  const { completeOnboarding } = useAuthGuard();
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

  const handleGenerate = async () => {
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
      await completeOnboarding();
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
    <div className="w-full md:max-w-[860px] mx-auto pt-6 md:pt-10 pb-8 px-4 sm:px-8 bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-md">
      {/* Step Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{remainingSteps === 0 ? 'Final Step' : `${remainingSteps} steps remaining`}</span>
        </div>
        <Progress
          value={progressPercentage}
          className="h-2 bg-slate-100"
          aria-label={`Workout setup progress (${remainingSteps} steps remaining)`}
        />
      </div>

      {/* Step Content Container */}
      <div className="min-h-[360px] flex flex-col justify-between">
        {/* Step 1: Goal */}
        {currentStep === 1 && (
          <div>
            <div className="mt-7">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Target className="w-6 h-6 text-indigo-600 shrink-0" />
                <span>What is your primary fitness goal?</span>
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Your goal drives exercise selection, rep ranges, and rest intervals.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CANONICAL_GOALS.map((g) => {
                const isSelected = goal === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    className={`min-h-[116px] p-5 rounded-2xl text-left border transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900">{g.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {g.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Experience */}
        {currentStep === 2 && (
          <div>
            <div className="mt-7">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Flame className="w-6 h-6 text-indigo-600 shrink-0" />
                <span>What is your training experience?</span>
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Calibrates exercise complexity and volume to prevent overtraining.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const isSelected = experience === lvl.value;
                const desc =
                  lvl.value === 'beginner'
                    ? 'Fundamental movement patterns, motor learning, and foundation building.'
                    : lvl.value === 'intermediate'
                    ? 'Progressive overload, varied compound lifts, and periodization.'
                    : 'High-intensity volume, advanced variations, and specialization.';

                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setExperience(lvl.value)}
                    className={`min-h-[116px] p-5 rounded-2xl text-left border transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900">{lvl.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Location & Equipment */}
        {currentStep === 3 && (
          <div>
            <div className="mt-7">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Dumbbell className="w-6 h-6 text-indigo-600 shrink-0" />
                <span>Where and with what will you train?</span>
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Select your environment and all available equipment.
              </p>
            </div>

            {/* Location Cards */}
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setLocation('gym');
                  setSelectedEquipment(['Dumbbells', 'Barbell', 'Cables', 'Machines', 'Bench', 'Bodyweight']);
                }}
                className={`min-h-[80px] p-5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                  location === 'gym'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Commercial Gym</span>
                    <span className="text-xs text-slate-500">Full machines & free weights</span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    location === 'gym'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {location === 'gym' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocation('home');
                  setSelectedEquipment(['Dumbbells', 'Bodyweight', 'Resistance Bands']);
                }}
                className={`min-h-[80px] p-5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                  location === 'home'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <HomeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Home / Limited</span>
                    <span className="text-xs text-slate-500">Bodyweight & portable items</span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    location === 'home'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {location === 'home' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </button>
            </div>

            {/* Equipment Chips */}
            <div className="mt-5">
              <span className="text-xs font-bold text-slate-700 mb-2.5 block uppercase tracking-wide">
                Available Equipment
              </span>
              <div className="flex flex-wrap gap-2.5">
                {EQUIPMENT_LIST.map((eq) => {
                  const isSelected = selectedEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      <span>{eq}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Days per Week */}
        {currentStep === 4 && (
          <div>
            <div className="mt-7">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Calendar className="w-6 h-6 text-indigo-600 shrink-0" />
                <span>How many days per week do you plan to train?</span>
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Helps configure appropriate weekly split density.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-7 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isSelected = daysPerWeek === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDaysPerWeek(num)}
                    className={`min-h-[72px] py-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white font-black shadow-md shadow-indigo-200'
                        : 'border-slate-200 hover:border-slate-300 text-slate-800 font-bold hover:bg-slate-50/80 bg-white'
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

            <p className="text-center text-xs text-slate-500 mt-4">
              Recommended for your goal: <strong className="text-slate-800 font-bold">3 to 4 days</strong> per week.
            </p>
          </div>
        )}

        {/* Step 5: Duration */}
        {currentStep === 5 && (
          <div>
            <div className="mt-7">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Clock className="w-6 h-6 text-indigo-600 shrink-0" />
                <span>Target workout duration</span>
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Sets the overall exercise count and density of your session.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-5 gap-2 sm:gap-3">
              {DURATION_PRESETS.map((mins) => {
                const isSelected = duration === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`min-h-[72px] py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200'
                        : 'border-slate-200 text-slate-800 font-semibold hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <span className="text-base block">{mins}</span>
                    <span className="text-[10px] uppercase">min</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-xs text-slate-600 mt-5">
              Estimated structure: <strong className="text-slate-900 font-bold">{Math.round(duration / 9)} compound/isolation exercises</strong> with warm-up and cool-down intervals.
            </div>
          </div>
        )}

        {/* Step 6: Target Muscle Focus */}
        {currentStep === 6 && (
          <div>
            <div className="mt-7">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-indigo-600 shrink-0" />
                <span>Select muscle groups to target</span>
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Choose Full Body or select specific focal splits for this session.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MUSCLE_FOCUS_OPTIONS.map((opt) => {
                const isSelected = selectedMuscles.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMuscle(opt.id)}
                    className={`min-h-[116px] p-5 rounded-2xl text-left border transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900">{opt.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Options -> Divider (28px: mt-7) -> Divider -> Footer buttons (24px: pt-6) */}
        <div className="mt-7 border-t border-slate-200/80 pt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="min-h-[44px] px-5 rounded-xl border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={isGenerating}
            className="min-h-[44px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5"
          >
            {currentStep === totalSteps ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Generating Plan...' : 'Generate Workout'}</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
