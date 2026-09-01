import { Metadata } from 'next';
import { GoalsView } from '@/components/goals/goals-view';

export const metadata: Metadata = {
  title: 'Fitness Goals — Workout Planner',
  description: 'Track and evaluate quantifiable fitness goals, volume targets, and progressive benchmarks.',
};

export default function GoalsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <GoalsView />
    </div>
  );
}
