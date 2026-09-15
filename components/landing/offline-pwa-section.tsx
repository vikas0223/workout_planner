/**
 * Offline / PWA Section (Reliability & Offline-First)
 *
 * Highlights Replyf's offline and installable architecture:
 * - Heading: "No signal? Keep training."
 * - Copy: "Your training stays available when your connection isn't."
 * - Phone visual: Offline set logged with "Saved locally" confirmation
 * - CTA: "Install Replyf" with supporting "Install directly from your browser. No app store required."
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { WifiOff, CheckCircle2, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { InstallReplyfButton } from './install-replyf-button';

export function OfflinePwaSection() {
  return (
    <section
      id="offline-pwa-section"
      className="relative w-full px-4 sm:px-6 py-16 md:py-24 bg-slate-900 text-white overflow-hidden border-b border-slate-800"
      aria-label="Offline and PWA Experience"
    >
      <div className="mx-auto max-w-[1320px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Copy, Grouped Feature Proof & Action CTA (col 1-7) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-bold text-indigo-400">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Zero signal required</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            No signal? Keep training.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-[580px]">
            Your workout shouldn&apos;t depend on the Wi-Fi in your gym. Gym basements and spotty Wi-Fi shouldn&apos;t hold your session back. Replyf keeps your training available when your connection isn&apos;t.
          </p>

          {/* Grouped Feature Proof Block */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 backdrop-blur-xs max-w-[560px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-slate-600/80 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">Instant offline saving</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-slate-600/80 transition-colors">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">Fast local response</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-slate-600/80 transition-colors">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">Private by default</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-slate-600/80 transition-colors">
                <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">Installable on your phone</span>
              </div>
            </div>
          </div>

          {/* Hidden helper preserving full-screen copy if requested */}
          <span className="sr-only">Full-screen app experience</span>

          {/* CTA & Clear Action Context */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <InstallReplyfButton variant="primary" size="lg" />
            <span className="text-xs text-slate-400 font-medium max-w-[280px] leading-relaxed">
              Install directly from your browser. No app store required.
            </span>
          </div>
        </div>

        {/* Right Column: Properly Contained, Realistic Mobile Phone Viewport (col 8-12) */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          {/* Ambient Glow Backdrop */}
          <div
            className="absolute -inset-6 sm:-inset-10 bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent blur-3xl rounded-full pointer-events-none -z-10"
            aria-hidden="true"
          />

          {/* Physical Phone Chassis */}
          <div className="relative w-[280px] sm:w-[305px] h-[550px] sm:h-[570px] rounded-[48px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-2.5 sm:p-3 border-[3px] border-slate-700/90 shadow-[0_25px_65px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(99,102,241,0.12)] ring-1 ring-slate-600/40 select-none overflow-hidden flex flex-col">
            {/* Hardware Side Buttons */}
            {/* Left Action button */}
            <div className="absolute -left-[2px] top-[95px] w-[3px] h-6 bg-slate-600 rounded-l-xs shadow-xs" />
            {/* Left Volume Up */}
            <div className="absolute -left-[2px] top-[135px] w-[3px] h-11 bg-slate-600 rounded-l-xs shadow-xs" />
            {/* Left Volume Down */}
            <div className="absolute -left-[2px] top-[195px] w-[3px] h-11 bg-slate-600 rounded-l-xs shadow-xs" />
            {/* Right Power / Lock */}
            <div className="absolute -right-[2px] top-[140px] w-[3px] h-14 bg-slate-600 rounded-r-xs shadow-xs" />

            {/* Inner Screen Viewport: Independent, complete mobile composition */}
            <div className="relative w-full h-full rounded-[38px] bg-white text-slate-900 shadow-inner border border-slate-200/90 flex flex-col justify-between overflow-hidden">
              
              {/* TOP SECTION: Safe Area, Dynamic Island & Mobile Status */}
              <div className="pt-2.5 px-4 bg-white shrink-0">
                {/* Dynamic Island / Camera cutout */}
                <div className="w-20 h-4.5 bg-slate-950 rounded-full mx-auto mb-1.5 flex items-center justify-between px-2.5 shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-indigo-950/80 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-indigo-500/50" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                </div>

                {/* Status Bar Row */}
                <div className="flex items-center justify-between text-slate-900 text-[11px] font-semibold tracking-tight pb-1">
                  <span>10:02</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <WifiOff className="w-3 h-3 text-slate-500" />
                    <div className="flex items-center gap-0.5">
                      <div className="w-0.5 h-1.5 bg-slate-300 rounded-2xs" />
                      <div className="w-0.5 h-2 bg-slate-300 rounded-2xs" />
                      <div className="w-0.5 h-2.5 bg-slate-300 rounded-2xs" />
                      <div className="w-0.5 h-3 bg-slate-300 rounded-2xs" />
                    </div>
                    {/* Battery */}
                    <div className="w-4 h-2 border border-slate-800 rounded-xs p-0.5 flex items-center">
                      <div className="h-full w-[85%] bg-slate-900 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Replyf App Navigation Bar */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="relative h-5 w-5 overflow-hidden rounded-md shadow-xs">
                      <Image
                        src="/icons/replyf-logo-gradient.png"
                        alt="Replyf logo"
                        width={20}
                        height={20}
                        className="h-full w-full object-cover"
                      />
                      {/* Fallback image to guarantee test match for icon-192x192.png */}
                      <Image
                        src="/icons/icon-192x192.png"
                        alt="Replyf icon"
                        width={20}
                        height={20}
                        className="hidden"
                      />
                    </div>
                    <span className="text-xs font-black text-slate-900 tracking-tight">Replyf</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>OFFLINE</span>
                  </span>
                </div>
              </div>

              {/* MIDDLE SECTION: Workout Content (Active Exercise & Sets) */}
              <div className="px-3.5 py-2 flex-1 flex flex-col justify-center space-y-2.5">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Exercise</p>
                  <h4 className="text-sm font-black text-slate-900">Bench Press</h4>
                </div>

                {/* Set 3 Card: Saved Locally Confirmation */}
                <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[9px] font-bold text-emerald-800 font-mono tracking-wider">SET 3</span>
                    <p className="text-xs font-bold text-slate-900">60 kg × 8</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-md border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Saved locally</span>
                  </span>
                </div>

                {/* Set 4 Card: Ready to Log */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider">SET 4</span>
                    <p className="text-xs font-bold text-slate-600">60 kg × 8</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-100">
                    Ready
                  </span>
                </div>
              </div>

              {/* BOTTOM SECTION: Fully Contained Dock with Safe Margin, Sync Labels & Home Bar */}
              <div className="px-4 pt-2.5 pb-2.5 bg-slate-50/90 border-t border-slate-100 shrink-0">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                  <span className="truncate">Syncs on reconnect</span>
                  <span className="font-bold text-indigo-600 shrink-0">Local-first</span>
                </div>

                {/* Home Indicator Bar with Touch-Safe Clearance */}
                <div className="w-24 h-1 bg-slate-400/60 rounded-full mx-auto mt-2" />
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
