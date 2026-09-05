import { Metadata } from 'next';
import { ProgramDetailView } from '@/components/programs/program-detail-view';

interface ProgramPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Program Details — replyf`,
    description: 'Detailed multi-week schedule and training progression.',
  };
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { id } = await params;
  return <ProgramDetailView programId={id} />;
}
