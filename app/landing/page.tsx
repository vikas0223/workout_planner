import { Metadata } from 'next';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { TrustStrip } from '@/components/landing/trust-strip';
import { FeatureStory } from '@/components/landing/feature-story';
import { ProgressShowcase } from '@/components/landing/progress-showcase';
import { RoutineBuilderShowcase } from '@/components/landing/routine-builder-showcase';
import { OfflinePwaSection } from '@/components/landing/offline-pwa-section';
import { FinalCta } from '@/components/landing/final-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://replyf.app'),
  title: 'Replyf — Stop guessing what to do next',
  description:
    'Build workouts, log every set, track your progress, and adapt your training with Replyf. Fast, private, and local-first.',
  keywords: [
    'workout planner',
    'fitness log',
    'progressive overload',
    'local first',
    'offline fitness app',
    'adaptive training',
    'Replyf',
  ],
  openGraph: {
    title: 'Replyf — Stop guessing what to do next',
    description:
      'Build workouts in seconds, log every set, and turn your training history into clear next steps.',
    url: 'https://replyf.app',
    siteName: 'Replyf',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Replyf Fitness Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Replyf — Stop guessing what to do next',
    description:
      'Build workouts, log every set, track your progress, and adapt your training with Replyf.',
    images: ['/icons/icon-192x192.png'],
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/15 text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 01 Landing Header */}
      <LandingHeader />

      {/* 02 Hero Section */}
      <HeroSection />

      {/* 03 Trust / Product Principles Strip */}
      <TrustStrip />

      {/* 04 Feature Story (Plan → Train → Track → Improve) */}
      <FeatureStory />

      {/* 05 Progress Showcase */}
      <ProgressShowcase />

      {/* 06 Routine Builder Showcase */}
      <RoutineBuilderShowcase />

      {/* 07 Offline / PWA Section */}
      <OfflinePwaSection />

      {/* 08 Final CTA */}
      <FinalCta />

      {/* 09 Semantic Footer */}
      <LandingFooter />
    </main>
  );
}
