/**
 * Install Replyf Guidance Modal (Part 30 & 31)
 *
 * Accessible Radix Dialog providing platform-specific install instructions
 * when native programmatic prompt is unsupported or unavailable.
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
import { Smartphone, Share2, MoreVertical, Monitor, CheckCircle2, X } from 'lucide-react';

export interface InstallReplyfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: PlatformType;
}

export function InstallReplyfModal({ open, onOpenChange, platform }: InstallReplyfModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-md shadow-indigo-200">
            <Image
              src="/icons/icon-192x192.png"
              alt="Replyf logo"
              width={56}
              height={56}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              Install Replyf
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Keep your workouts one tap away. Free. No app store required.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2 text-left">
          {/* iOS Safari Guidance */}
          {(platform === 'ios' || platform === 'other') && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 text-sm">iPhone & iPad (Safari)</p>
                <p className="text-slate-600 leading-relaxed">
                  1. Tap the <strong className="text-indigo-700">Share</strong> button at the bottom of the screen.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  2. Scroll down and select <strong className="text-indigo-700">Add to Home Screen</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Android Chrome Guidance */}
          {(platform === 'android' || platform === 'other') && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <MoreVertical className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 text-sm">Android (Chrome)</p>
                <p className="text-slate-600 leading-relaxed">
                  1. Tap the menu <strong className="text-slate-800">⋮</strong> in the top right.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  2. Tap <strong className="text-slate-800">Install app</strong> or <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Desktop Chrome / Edge Guidance */}
          {(platform === 'desktop-chrome' || platform === 'other') && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 text-sm">Desktop (Chrome / Edge)</p>
                <p className="text-slate-600 leading-relaxed">
                  Click the <strong className="text-indigo-700">Install</strong> icon in the browser address bar, or use the browser menu to install.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-700 justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Works 100% offline once added to your device.</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="min-h-[44px] w-full mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          Got it
        </button>
      </DialogContent>
    </Dialog>
  );
}
