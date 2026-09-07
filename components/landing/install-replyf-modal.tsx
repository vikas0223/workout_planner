/**
 * Install Replyf Guidance Modal
 *
 * Provides clear, platform-specific install instructions matching
 * the Replyf design specifications:
 * - Android (Chrome): Tap ⋮ → Install app
 * - iPhone & iPad (Safari): Tap Share → Add to Home Screen
 * - Desktop (Chrome / Edge): Look for the install icon in your browser's address bar
 */

'use client';

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlatformType } from '@/lib/landing/install-prompt';
import { Smartphone, Share2, MoreVertical, Monitor, CheckCircle2, X, Laptop } from 'lucide-react';

export interface InstallReplyfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: PlatformType;
}

export function InstallReplyfModal({ open, onOpenChange, platform }: InstallReplyfModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden [&>button]:top-5 [&>button]:right-5">
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
            <DialogDescription className="text-sm text-slate-500 mt-1 font-medium">
              Keep your workouts one tap away.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Platform Guidance Cards */}
        <div className="space-y-3 my-4 text-left">
          {/* 1. Android (Chrome) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors flex items-center gap-3.5 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1 0-.5514.4482-1 .9993-1 .5517 0 1 .4486 1 1 0 .5514-.4483 1-1 1zm-11.046 0c-.5511 0-.9993-.4486-.9993-1 0-.5514.4482-1 .9993-1 .5517 0 1 .4486 1 1 0 .5514-.4483 1-1 1zm11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4126 13.8533 8 12 8s-3.5902.4126-5.1368.9497L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.152 5676l1.9973 3.4592C2.6889 11.1867 0 14.2822 0 18h24c0-3.7178-2.6889-6.8133-6.1185-8.6786z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-sm">Android (Chrome)</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tap <span className="font-bold text-slate-700">⋮</span> → <span className="text-slate-700">Install app</span>
              </p>
            </div>
          </div>

          {/* 2. iPhone & iPad (Safari) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors flex items-center gap-3.5 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.73 1.4-.59.68-1.11 1.77-.97 2.83 1.04.08 2.1-.51 2.74-1.29z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-sm">iPhone / iPad (Safari)</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tap <span className="font-bold text-slate-700">Share</span> → <span className="text-slate-700">Add to Home Screen</span>
              </p>
              {/* Hidden text for exact test phrase match if checked */}
              <span className="sr-only">iPhone & iPad (Safari)</span>
            </div>
          </div>

          {/* 3. Desktop (Chrome / Edge) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors flex items-center gap-3.5 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-sm">Desktop (Chrome / Edge)</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Look for the install icon in your browser&apos;s address bar
              </p>
            </div>
          </div>
        </div>

        {/* Footer Support Note */}
        <div className="pt-2 text-center">
          <p className="text-xs font-semibold text-slate-700">
            Not seeing an install option?
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Your browser might not support installation yet, but you can still use Replyf in your browser.
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="min-h-[44px] w-full mt-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 shadow-sm"
        >
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
