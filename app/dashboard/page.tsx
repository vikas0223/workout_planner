'use client';

import React from 'react';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16">
      <DashboardView />
    </main>
  );
}
