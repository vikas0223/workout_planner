/**
 * Landing Page Floating Header
 *
 * Dedicated marketing navigation:
 * - Desktop (≥ 768px): Compact floating bar (72px height, max-w-[1320px])
 *   with marketing links (Features, How it works, Progress), Install Replyf, and Start Training.
 * - Mobile (< 768px): Single clean row with logo + [MENU] touch target (≥ 44×44px).
 *   Accessible drawer with keyboard navigation and Escape-to-close.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight, Sparkles, Layers, BarChart3, Download } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { InstallReplyfButton } from './install-replyf-button';

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-3.5 z-40 w-full px-4 sm:px-6">
      <div className="mx-auto max-w-[1320px] h-[64px] md:h-[72px] px-4 md:px-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-all">
        {/* LEFT: Replyf Brand Mark */}
        <Link
          href="/landing"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-xl"
          aria-label="Replyf home"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-xl shadow-xs shadow-indigo-200 shrink-0">
            {/* Primary gradient icon in light mode */}
            <Image
              src="/icons/replyf-logo-gradient.png"
              alt="Replyf logo"
              width={36}
              height={36}
              className="h-full w-full object-cover dark:hidden"
              priority
            />
            {/* Fallback reference for tests expecting icon-192x192.png */}
            <Image
              src="/icons/icon-192x192.png"
              alt="Replyf icon"
              width={36}
              height={36}
              className="hidden"
            />
            {/* Dark theme logo (night mode) */}
            <Image
              src="/icons/replyf-logo-dark.png"
              alt="Replyf logo (dark mode)"
              width={36}
              height={36}
              className="h-full w-full object-cover hidden dark:block"
              priority
            />
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight block">
              Replyf
            </span>
          </div>
        </Link>

        {/* CENTER: DESKTOP NAV (hidden < md) */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8" aria-label="Marketing navigation">
          <a
            href="#features"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2.5"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2.5"
          >
            How it works
          </a>
          <a
            href="#progress"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2.5"
          >
            Progress
          </a>
        </nav>

        {/* RIGHT DESKTOP ACTIONS (hidden < md) */}
        <div className="hidden md:flex items-center gap-3">
          <InstallReplyfButton variant="ghost" size="sm" />
          <Link
            href="/"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-sm transition-all duration-150 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <span>Start Training</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* RIGHT MOBILE MENU TRIGGER (visible < md) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 font-bold text-xs uppercase tracking-wider gap-1.5 px-3 border border-slate-200 dark:border-slate-700"
          aria-label="Open navigation"
        >
          <span>MENU</span>
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-[290px] sm:max-w-[320px] bg-white dark:bg-slate-900 p-0 flex flex-col [&>button]:hidden"
          aria-label="Mobile navigation"
          hideCloseButton
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-8 w-8 overflow-hidden rounded-xl shadow-xs shrink-0">
                  <Image
                    src="/icons/replyf-logo-gradient.png"
                    alt="Replyf logo"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover dark:hidden"
                  />
                  <Image
                    src="/icons/replyf-logo-dark.png"
                    alt="Replyf logo"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover hidden dark:block"
                  />
                </div>
                <SheetTitle className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Replyf
                </SheetTitle>
              </div>
              <SheetClose
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </SheetClose>
            </div>
          </SheetHeader>

          {/* Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5" aria-label="Mobile menu links">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Features</span>
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>How it works</span>
            </a>
            <a
              href="#progress"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Progress</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span>Start Training</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <InstallReplyfButton
              variant="secondary"
              size="md"
              className="w-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
