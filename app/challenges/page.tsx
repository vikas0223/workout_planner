import { Metadata } from 'next';
import { ChallengesView } from '@/components/challenges/challenges-view';
import { RouteGuardShell } from '@/components/layout/route-guard-shell';

export const metadata: Metadata = {
  title: 'Fitness Challenges — Replyf',
  description: 'Participate in milestone challenges for workout count, volume, and streaks.',
};

export default function ChallengesPage() {
  return (
    <main className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 text-slate-800 min-h-screen py-6 sm:py-10">
      <RouteGuardShell>
        <ChallengesView />
      </RouteGuardShell>
    </main>
  );
}
