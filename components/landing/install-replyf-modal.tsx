/**
 * Install Replyf Guidance Modal
 *
 * Provides clear, platform-specific install instructions matching
 * the Replyf design specifications:
 * - Android (Chrome): Tap ⋮ → Install app / Add to Home screen
 * - iPhone & iPad (Safari): Tap Share → Add to Home Screen → Add
 * - Desktop (Chrome / Edge): Look for the install icon in your browser's address bar
 * - Unsupported: Neutral guidance that Replyf can still be used in your browser
 *
 * Fully accessible: Radix Dialog primitives, accessible title & description,
 * focus trap, keyboard navigation (Escape to dismiss), and min 44px touch targets.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlatformType } from '@/lib/landing/install-prompt';
import { Share2, Laptop, Globe } from 'lucide-react';

export interface InstallReplyfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: PlatformType;
}

export function InstallReplyfModal({ open, onOpenChange, platform }: InstallReplyfModalProps) {
  // Allow user to toggle device instructions if desired (defaulting to detected platform)
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>(platform);

  useEffect(() => {
    setSelectedPlatform(platform);
  }, [platform]);

  const activePlatform = selectedPlatform || platform;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[440px] p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden [&>button]:top-5 [&>button]:right-5"
        aria-describedby="install-replyf-description"
      >
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-2">
          {/* Replyf Gradient Logo */}
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-lg shadow-indigo-200 shrink-0">
            <Image
              src="/icons/replyf-logo-gradient.png"
              alt="Replyf logo"
              width={64}
              height={64}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              Install Replyf
            </DialogTitle>
            <DialogDescription id="install-replyf-description" className="text-sm text-slate-500 mt-1 font-medium">
              Keep your workouts one tap away.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Platform Guidance Content: Only displays the active/detected platform */}
        <div className="my-4 text-left">
          {/* 1. iPhone & iPad (Safari) */}
          {activePlatform === 'ios' && (
            <div
              data-testid="platform-guide-ios"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.73 1.4-.59.68-1.11 1.77-.97 2.83 1.04.08 2.1-.51 2.74-1.29z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">iPhone & iPad (Safari)</p>
                  <p className="text-[11px] text-slate-400">iOS browser-controlled installation</p>
                </div>
              </div>

              <ol className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap <span className="font-bold text-slate-900 inline-flex items-center gap-1">Share <Share2 className="w-3 h-3 text-slate-500 inline" /></span> in Safari&apos;s bottom toolbar
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and tap <span className="font-bold text-slate-900">Add to Home Screen</span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <span className="font-bold text-slate-900">Add</span> in the top-right corner
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* 2. Android (Chrome) */}
          {activePlatform === 'android' && (
            <div
              data-testid="platform-guide-android"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1 0-.5514.4482-1 .9993-1 .5517 0 1 .4486 1 1 0 .5514-.4483 1-1 1zm-11.046 0c-.5511 0-.9993-.4486-.9993-1 0-.5514.4482-1 .9993-1 .5517 0 1 .4486 1 1 0 .5514-.4483 1-1 1zm11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4126 13.8533 8 12 8s-3.5902.4126-5.1368.9497L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.152 5676l1.9973 3.4592C2.6889 11.1867 0 14.2822 0 18h24c0-3.7178-2.6889-6.8133-6.1185-8.6786z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Android (Chrome)</p>
                  <p className="text-[11px] text-slate-400">Browser menu installation</p>
                </div>
              </div>

              <ol className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open your browser menu (tap <span className="font-bold text-slate-900">⋮</span>)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Look for <span className="font-bold text-slate-900">&quot;Install app&quot;</span> or <span className="font-bold text-slate-900">&quot;Add to Home screen&quot;</span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Confirm installation when prompted (wording may vary by browser)
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* 3. Desktop (Chrome / Edge) */}
          {activePlatform === 'desktop-chrome' && (
            <div
              data-testid="platform-guide-desktop"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Desktop (Chrome / Edge)</p>
                  <p className="text-[11px] text-slate-400">Address bar installation</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <p>
                  Look for the install icon in your browser&apos;s address bar or browser menu.
                </p>
                <p className="text-[11px] text-slate-400">
                  If your browser uses a different UI, look for &quot;Install Replyf&quot; in the application menu.
                </p>
              </div>
            </div>
          )}

          {/* 4. Other / Unsupported Fallback */}
          {activePlatform === 'other' && (
            <div
              data-testid="platform-guide-other"
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Web Browser</p>
                  <p className="text-[11px] text-slate-400">Supported web environment</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-800">
                Replyf can still be used in your browser.
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Bookmark this page or pin this tab to keep your workouts one tap away. All workouts, timer functions, and offline logs operate reliably right here.
              </p>
            </div>
          )}
        </div>

        {/* Platform Switcher Pills */}
        <div className="pt-1 text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Switch Device Guide
          </p>
          <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setSelectedPlatform('ios')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePlatform === 'ios'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              iOS
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('android')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePlatform === 'android'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Android
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('desktop-chrome')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePlatform === 'desktop-chrome'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('other')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePlatform === 'other'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Browser
            </button>
          </div>
        </div>

        {/* Accessible Dismiss Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="min-h-[44px] w-full mt-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 shadow-sm"
          aria-label="Close installation instructions"
        >
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
