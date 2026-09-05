/**
 * Landing Page Floating Header (Part 8 & 9)
 *
 * Dedicated marketing header:
 * - Desktop (≥ 768px): Floating compact navbar (72px height, max-w-[1320px])
 *   with lightweight marketing anchors (Features, How it works, Progress)
 *   and "Start Training" primary CTA.
 * - Mobile (< 768px): Compact header with Replyf logo + ☰ hamburger button.
 *   Slide-in Sheet drawer provides accessible navigation and CTAs.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight, Sparkles, Layers, BarChart3, Smartphone } from 'lucide-react';
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
    <header className="sticky top-4 z-40 w-full px-4 sm:px-6">
      <div className="mx-auto max-w-[1320px] h-[64px] md:h-[72px] px-4 md:px-6 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center justify-between transition-all">
        {/* LEFT: Replyf Brand Mark */}
        <Link
          href="/landing"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-xl"
          aria-label="Replyf home"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-xl shadow-sm shadow-indigo-200 shrink-0">
            <Image
              src="/icons/icon-192x192.png"
              alt="Replyf logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div>
            <span className="text-base font-black text-slate-900 tracking-tight leading-tight block">
              Replyf
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Local-first fitness
            </span>
          </div>
        </Link>

        {/* CENTER / RIGHT DESKTOP NAV (hidden < md) */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Marketing navigation">
          <a
            href="#features"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2"
          >
            How it works
          </a>
          <a
            href="#progress"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg py-1 px-2"
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
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* RIGHT MOBILE MENU BUTTON (visible < md) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-[290px] sm:max-w-[320px] bg-white p-0 flex flex-col [&>button]:hidden"
          aria-label="Mobile navigation"
          hideCloseButton
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-8 w-8 overflow-hidden rounded-xl shadow-sm shadow-indigo-200 shrink-0">
                  <Image
                    src="/icons/icon-192x192.png"
                    alt="Replyf logo"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <SheetTitle className="text-base font-black text-slate-900 tracking-tight">
                  Replyf
                </SheetTitle>
              </div>
              <SheetClose
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </SheetClose>
            </div>
          </SheetHeader>

          {/* Links */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1" aria-label="Mobile menu links">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Features</span>
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors"
            >
              <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>How it works</span>
            </a>
            <a
              href="#progress"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Progress</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="border-t border-slate-100 p-5 space-y-3">
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
