import { Metadata } from 'next';
import { ProgramsView } from '@/components/programs/programs-view';
import { RouteGuardShell } from '@/components/layout/route-guard-shell';

export const metadata: Metadata = {
  title: 'Training Programs — Replyf',
  description: 'Structured, multi-week training programs with automated progression',
};

export default function ProgramsPage() {
  return (
    <div className="py-8 min-h-screen">
      <RouteGuardShell>
        <ProgramsView />
      </RouteGuardShell>
    </div>
  );
}
