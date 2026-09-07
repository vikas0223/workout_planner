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
  headline: string;
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
    headline: 'You know the goal. Replyf builds the starting point.',
    title: 'Start with a workout that fits you.',
    description:
      'Choose your goal, experience, schedule, available equipment, and preferences. Replyf turns those inputs into a structured workout you can still edit.',
    highlights: [
      'Goal-specific programming',
      'Equipment & schedule constraints',
      'Fully customizable templates',
    ],
    visualState: 'plan_generator',
  },
  {
    id: 'train',
    label: 'TRAIN',
    stepNumber: '02',
    headline: 'The plan becomes your workout.',
    title: 'Log every set without breaking your flow.',
    description:
      'Follow the session, log each set, track your effort, and stay focused on the work instead of remembering what comes next.',
    highlights: [
      'Rest timer intervals',
      'Real-time set completion',
      'Exercise substitutions',
    ],
    visualState: 'train_logger',
  },
  {
    id: 'track',
    label: 'TRACK',
    stepNumber: '03',
    headline: 'Your workouts start telling a story.',
    title: 'Turn workouts into progress.',
    description:
      'Every completed set becomes part of your training history. See volume, consistency, personal records, and strength trends without digging through old sessions.',
    highlights: [
      'Volume trends',
      'Estimated 1RM records',
      'Consistency and adherence',
    ],
    visualState: 'track_analytics',
  },
  {
    id: 'improve',
    label: 'IMPROVE',
    stepNumber: '04',
    headline: 'Your next workout starts with your last one.',
    title: 'Know what to do next.',
    description:
      'Use your recent performance, preferences, constraints, fatigue signals, and training history to make better decisions about your next session.',
    highlights: [
      'Deterministic load progression',
      'Recovery & fatigue adjustments',
      'Intelligent volume adjustments',
    ],
    visualState: 'improve_recommend',
  },
];
