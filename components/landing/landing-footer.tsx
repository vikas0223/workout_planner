/**
 * Landing Page Footer (Part 34)
 *
 * Clean semantic marketing footer:
 * - Brand mark and tagline
 * - Section anchors (Features, How it works, Progress)
 * - Local-first privacy statement
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200/80 bg-white py-12 px-4 sm:px-6" aria-label="Landing footer">
      <div className="mx-auto max-w-[1320px] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2.5">
            <div className="relative h-7 w-7 overflow-hidden rounded-xl shadow-xs">
              <Image
                src="/icons/icon-192x192.png"
                alt="Replyf logo"
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-base font-black text-slate-900 tracking-tight">Replyf</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Local-first fitness. Stop guessing what to do next.
          </p>
        </div>

        {/* Marketing Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600" aria-label="Footer links">
          <a href="#features" className="hover:text-indigo-600 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
            How it works
          </a>
          <a href="#progress" className="hover:text-indigo-600 transition-colors">
            Progress
          </a>
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Launch App
          </Link>
        </nav>

        {/* Copyright & Local-First Note */}
        <div className="text-xs text-slate-400">
          <p>© {currentYear} Replyf. Built with local-first privacy.</p>
        </div>
      </div>
    </footer>
  );
}
