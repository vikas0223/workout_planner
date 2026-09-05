/**
 * Landing Page Feature Chapters Data Model
 * 
 * Defines the structured content for Replyf's core training loop:
 * Plan → Train → Track → Improve
 */

export type LandingFeatureId = 'plan' | 'train' | 'track' | 'improve';

export interface LandingFeature {
  id: LandingFeatureId;
  label: string;
  stepNumber: string;
  title: string;
  description: string;
  highlights: string[];
  visualState: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: 'plan',
    label: 'PLAN',
    stepNumber: '01',
    title: 'Start with a workout that fits you.',
    description:
      'Choose your goal, experience, schedule, equipment, and preferences. Replyf turns those inputs into a structured workout you can still edit.',
    highlights: ['Goal-specific programming', 'Equipment & schedule constraints', 'Fully customizable templates'],
    visualState: 'plan_generator',
  },
  {
    id: 'train',
    label: 'TRAIN',
    stepNumber: '02',
    title: 'Log every set without breaking your flow.',
    description:
      'Track reps, load, rest, RPE, notes, and substitutions while you train.',
    highlights: ['Rest timer intervals', 'Real-time set checkoffs', 'One-tap exercise substitutions'],
    visualState: 'train_logger',
  },
  {
    id: 'track',
    label: 'TRACK',
    stepNumber: '03',
    title: 'Turn workouts into progress.',
    description:
      'See volume, consistency, personal records, and training trends without digging through old sessions.',
    highlights: ['Tonnage & volume trends', 'Estimated 1RM records', 'Adherence & consistency index'],
    visualState: 'track_analytics',
  },
  {
    id: 'improve',
    label: 'IMPROVE',
    stepNumber: '04',
    title: 'Know what to do next.',
    description:
      'Use your recent training, preferences, constraints, and performance to make better decisions about your next session.',
    highlights: ['Deterministic load progression', 'Recovery & fatigue suppression', 'Intelligent volume adjustments'],
    visualState: 'improve_recommend',
  },
];
