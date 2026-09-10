import { Metadata } from 'next';
import { ProgramsView } from '@/components/programs/programs-view';
import { RouteGuardShell } from '@/components/layout/route-guard-shell';

export const metadata: Metadata = {
  title: 'Training Programs — Replyf',
  description: 'Structured, multi-week training programs with automated progression',
};

export default function ProgramsPage() {
  return (
    <main className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 text-slate-800 min-h-screen py-6 sm:py-10">
      <RouteGuardShell>
        <ProgramsView />
      </RouteGuardShell>
    </main>
  );
}
