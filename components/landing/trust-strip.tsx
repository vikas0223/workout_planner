/**
 * Trust / Product Principles Strip (Part 14)
 * 
 * Reassures users on core architectural differentiation:
 * ✓ Works offline • ✓ Your training stays local • ✓ Sync when signed in • ✓ Installable on your phone
 */

import React from 'react';
import { WifiOff, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';

const PRINCIPLES = [
  { icon: WifiOff, label: 'Works offline', description: 'Zero lag in gym basements' },
  { icon: ShieldCheck, label: 'Your training stays local', description: 'Private by design' },
  { icon: RefreshCw, label: 'Sync when signed in', description: 'Seamless multi-device backup' },
  { icon: Smartphone, label: 'Installable on your phone', description: 'No app store required' },
];

export function TrustStrip() {
  return (
    <section className="w-full px-4 sm:px-6 py-6 border-y border-slate-200/60 bg-white/50 backdrop-blur-sm">
      <div className="mx-auto max-w-[1320px] grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {PRINCIPLES.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.label} className="flex items-center gap-3 p-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>✓</span>
                  <span>{p.label}</span>
                </p>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                  {p.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
