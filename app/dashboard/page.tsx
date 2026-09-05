'use client';

import React from 'react';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { RouteGuardShell } from '@/components/layout/route-guard-shell';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16 pt-4">
      <RouteGuardShell>
        <DashboardView />
      </RouteGuardShell>
    </main>
  );
}
