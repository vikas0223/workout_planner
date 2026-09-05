/**
 * Final Call to Action Section (Part 33)
 *
 * Final high-conversion CTA banner:
 * - Heading: "Make your next workout count."
 * - Kicker: "Build it. Train it. Track it. Improve it."
 * - Primary CTA: "Start Training" (routes to /)
 */

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { InstallReplyfButton } from './install-replyf-button';

export function FinalCta() {
  return (
    <section className="relative w-full px-4 sm:px-6 py-20 md:py-28 bg-gradient-to-b from-white to-indigo-50/40 border-t border-slate-200/60 overflow-hidden">
      <div className="mx-auto max-w-[900px] text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
          <Zap className="w-3.5 h-3.5" />
          <span>Ready for your next set?</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Make your next workout count.
        </h2>

        <p className="text-lg sm:text-xl font-medium text-slate-600 max-w-[620px] mx-auto">
          Build it. Train it. Track it. Improve it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/"
            className="min-h-[52px] w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-base font-bold shadow-lg shadow-indigo-200 transition-all duration-150 inline-flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <span>Start Training</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </Link>

          <InstallReplyfButton variant="secondary" size="lg" className="w-full sm:w-auto min-h-[52px]" />
        </div>

        <div className="flex items-center justify-center gap-6 pt-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            No account required to start
          </span>
          <span>•</span>
          <span>100% Free</span>
          <span>•</span>
          <span>Works offline</span>
        </div>
      </div>
    </section>
  );
}
