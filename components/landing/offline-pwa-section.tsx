/**
 * Offline / PWA Section (Part 19, 27, 28)
 *
 * Highlights Replyf's offline and installable architecture:
 * - Heading: "No signal? Keep training."
 * - Copy: "Your training stays available when your connection isn't."
 * - Phone visual: Offline set logged with "Saved locally" confirmation
 * - CTA: "Install Replyf" with supporting "Install directly from your browser. No app store required."
 */

import React from 'react';
import Image from 'next/image';
import { WifiOff, CheckCircle2, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { InstallReplyfButton } from './install-replyf-button';

export function OfflinePwaSection() {
  return (
    <section
      className="relative w-full px-4 sm:px-6 py-16 md:py-24 bg-slate-900 text-white overflow-hidden"
      aria-label="Offline and PWA Experience"
    >
      <div className="mx-auto max-w-[1320px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Copy & Value Proposition (col 1-7) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-400">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Zero signal required</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            No signal? Keep training.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-[600px]">
            Gym basements and spotty Wi-Fi shouldn&apos;t hold your session back. Replyf runs completely on your device so you can generate, log, and time sets with zero latency.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-[580px]">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Instant offline saving</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Zero network latency</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Private by default</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80">
              <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Full-screen app experience</span>
            </div>
          </div>

          {/* CTA & Microcopy */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <InstallReplyfButton variant="primary" size="lg" />
            <span className="text-xs text-slate-400 font-medium">
              Install directly from your browser. No app store required.
            </span>
          </div>
        </div>

        {/* Right Column: Phone-Framed Offline UI Mockup (col 8-12) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[300px] sm:w-[320px] rounded-[40px] bg-slate-950 border-[6px] border-slate-800 p-4 shadow-2xl shadow-black/80">
            {/* Phone notch */}
            <div className="mx-auto w-28 h-4 rounded-full bg-slate-800 mb-4" />

            {/* In-App Screen Content */}
            <div className="space-y-4 text-slate-900 rounded-3xl bg-white p-4">
              {/* Mini App Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="relative h-6 w-6 overflow-hidden rounded-lg">
                    <Image
                      src="/icons/icon-192x192.png"
                      alt="Replyf logo"
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-black text-slate-900">Replyf</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 flex items-center gap-1">
                  <WifiOff className="w-2.5 h-2.5" />
                  <span>Offline</span>
                </span>
              </div>

              {/* Offline Exercise Session */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Exercise</p>
                <h4 className="text-sm font-black text-slate-900">Bench Press</h4>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 font-mono">SET 3</span>
                    <p className="text-xs font-bold text-slate-900">60 kg × 8 reps</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Saved locally</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">SET 4</span>
                    <p className="text-xs font-bold text-slate-600">60 kg × 8 reps</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Ready</span>
                </div>
              </div>

              {/* Local Storage Indicator */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Syncs on reconnect</span>
                <span className="font-bold text-indigo-600">100% available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
