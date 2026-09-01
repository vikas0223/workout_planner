import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Progress & Analytics — Workout Planner',
  description: 'Track your training frequency, strength volume, personal records, and muscle balance.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
