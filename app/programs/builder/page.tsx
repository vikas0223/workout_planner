import { Metadata } from 'next';
import { ProgramBuilder } from '@/components/programs/program-builder';

export const metadata: Metadata = {
  title: 'Program Builder — Workout Planner',
  description: 'Design custom multi-week training programs with progressive scheduling.',
};

export default function ProgramBuilderPage() {
  return <ProgramBuilder />;
}
