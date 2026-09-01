import { Metadata } from 'next';
import { ChallengesView } from '@/components/challenges/challenges-view';

export const metadata: Metadata = {
  title: 'Fitness Challenges — Workout Planner',
  description: 'Participate in milestone challenges for workout count, volume, and streaks.',
};

export default function ChallengesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ChallengesView />
    </div>
  );
}
