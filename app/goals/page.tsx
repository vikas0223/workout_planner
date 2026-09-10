import { Metadata } from 'next';
import { GoalsView } from '@/components/goals/goals-view';
import { RouteGuardShell } from '@/components/layout/route-guard-shell';

export const metadata: Metadata = {
  title: 'Fitness Goals — Replyf',
  description: 'Track and evaluate quantifiable fitness goals, volume targets, and progressive benchmarks.',
};

export default function GoalsPage() {
  return (
    <main className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 text-slate-800 min-h-screen py-6 sm:py-10">
      <RouteGuardShell>
        <GoalsView />
      </RouteGuardShell>
    </main>
  );
}
