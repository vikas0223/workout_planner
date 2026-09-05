import { Metadata } from 'next';
import { ChallengesView } from '@/components/challenges/challenges-view';
import { RouteGuardShell } from '@/components/layout/route-guard-shell';

export const metadata: Metadata = {
  title: 'Fitness Challenges — Replyf',
  description: 'Participate in milestone challenges for workout count, volume, and streaks.',
};

export default function ChallengesPage() {
  return (
    <div className="py-8 min-h-screen">
      <RouteGuardShell>
        <ChallengesView />
      </RouteGuardShell>
    </div>
  );
}
