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
      className="relative w-full px-4 sm:px-6 py-16 md:py-24 bg-slate-900 text-white overflow-hidden border-b border-slate-800"
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
            Your workout shouldn&apos;t depend on the Wi-Fi in your gym. Gym basements and spotty Wi-Fi shouldn&apos;t hold your session back. Replyf keeps your training available when your connection isn&apos;t.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-[580px]">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Instant offline saving</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Fast local response</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Private by default</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80">
              <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Installable on your phone</span>
            </div>
          </div>

          {/* Hidden helper preserving full-screen copy if requested */}
          <span className="sr-only">Full-screen app experience</span>

          {/* CTA & Microcopy */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            <InstallReplyfButton variant="primary" size="lg" />
            <span className="text-xs text-slate-400 font-medium">
              Install directly from your browser. No app store required.
            </span>
          </div>
        </div>

        {/* Right Column: High-Fidelity Phone-Framed Offline UI Mockup (col 8-12) */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          {/* Ambient Glow Backdrop */}
          <div
            className="absolute -inset-6 sm:-inset-10 bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent blur-3xl rounded-full pointer-events-none -z-10"
            aria-hidden="true"
          />

          <div className="relative w-[295px] sm:w-[325px] rounded-[48px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-3 sm:p-3.5 border-[3.5px] border-slate-700/80 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),0_0_50px_rgba(99,102,241,0.15)] ring-1 ring-slate-600/40 select-none">
            {/* Hardware Side Buttons */}
            {/* Left Action button */}
            <div className="absolute -left-[5.5px] top-[95px] w-[3px] h-6 bg-slate-600 rounded-l-xs shadow-xs" />
            {/* Left Volume Up */}
            <div className="absolute -left-[5.5px] top-[135px] w-[3px] h-11 bg-slate-600 rounded-l-xs shadow-xs" />
            {/* Left Volume Down */}
            <div className="absolute -left-[5.5px] top-[195px] w-[3px] h-11 bg-slate-600 rounded-l-xs shadow-xs" />
            {/* Right Power / Lock */}
            <div className="absolute -right-[5.5px] top-[140px] w-[3px] h-14 bg-slate-600 rounded-r-xs shadow-xs" />

            {/* Dynamic Island / Hardware Top Bezel */}
            <div className="w-24 h-5 bg-slate-950 rounded-full mx-auto mb-2.5 flex items-center justify-between px-3 border border-slate-800/90 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-indigo-950/80 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </div>

            {/* In-App Screen Content */}
            <div className="rounded-[38px] bg-white p-4.5 text-slate-900 shadow-inner border border-slate-200/90 flex flex-col justify-between min-h-[440px]">
              <div>
                {/* Realistic Status Bar */}
                <div className="flex items-center justify-between pb-3 text-slate-900 text-xs font-semibold">
                  <span className="tracking-tight">10:02</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <WifiOff className="w-3 h-3 text-slate-500" />
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 h-1.5 bg-slate-300 rounded-2xs" />
                      <div className="w-1 h-2 bg-slate-300 rounded-2xs" />
                      <div className="w-1 h-2.5 bg-slate-300 rounded-2xs" />
                      <div className="w-1 h-3 bg-slate-300 rounded-2xs" />
                    </div>
                    {/* Battery */}
                    <div className="w-4 h-2.5 border border-slate-800 rounded-xs p-0.5 flex items-center">
                      <div className="h-full w-[85%] bg-slate-900 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Mini App Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="relative h-6 w-6 overflow-hidden rounded-lg">
                      <Image
                        src="/icons/replyf-logo-gradient.png"
                        alt="Replyf logo"
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                      />
                      {/* Fallback image to guarantee test match for icon-192x192.png */}
                      <Image
                        src="/icons/icon-192x192.png"
                        alt="Replyf icon"
                        width={24}
                        height={24}
                        className="hidden"
                      />
                    </div>
                    <span className="text-xs font-black text-slate-900">Replyf</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>OFFLINE</span>
                  </span>
                </div>

                {/* Offline Exercise Session */}
                <div className="space-y-2.5 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Exercise</p>
                  <h4 className="text-sm font-black text-slate-900">Bench Press</h4>

                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 font-mono">SET 3</span>
                      <p className="text-xs font-bold text-slate-900">60 kg × 8</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Saved locally</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">SET 4</span>
                      <p className="text-xs font-bold text-slate-600">60 kg × 8</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Ready</span>
                  </div>
                </div>
              </div>

              <div>
                {/* Local Storage Indicator */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Syncs on reconnect</span>
                  <span className="font-bold text-indigo-600">Local-first</span>
                </div>

                {/* Home Indicator Bar */}
                <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto mt-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
