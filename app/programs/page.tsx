import { Metadata } from 'next';
import { ProgramsView } from '@/components/programs/programs-view';

export const metadata: Metadata = {
  title: 'Training Programs — Workout Planner',
  description: 'Structured multi-week periodization cycles, progressive overload, and daily adherence tracking.',
};

export default function ProgramsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ProgramsView />
    </div>
  );
}
