import { Metadata } from 'next';
import { GoalsView } from '@/components/goals/goals-view';
import { RouteGuardShell } from '@/components/layout/route-guard-shell';

export const metadata: Metadata = {
  title: 'Fitness Goals — Replyf',
  description: 'Track and evaluate quantifiable fitness goals, volume targets, and progressive benchmarks.',
};

export default function GoalsPage() {
  return (
    <div className="py-8 min-h-screen">
      <RouteGuardShell>
        <GoalsView />
      </RouteGuardShell>
    </div>
  );
}
