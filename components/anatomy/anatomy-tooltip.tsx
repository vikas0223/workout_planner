/**
 * Anatomy Tooltip Component
 * 
 * Shows real-time contextual information and exercise counts for hovered/focused regions.
 */

'use client';

import React from 'react';
import { AnatomyRegionDefinition } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { Dumbbell } from 'lucide-react';

export interface AnatomyTooltipProps {
  region: AnatomyRegionDefinition | null;
  exerciseCount?: number;
}

export function AnatomyTooltip({ region, exerciseCount }: AnatomyTooltipProps) {
  if (!region) {
    return (
      <div className="min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
        Hover or tap any body region or joint to explore
      </div>
    );
  }

  return (
    <div className="min-h-[44px] flex items-center justify-between gap-3 p-2.5 px-3 rounded-xl bg-slate-900 text-white shadow-lg animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none">
      <div className="flex items-center gap-2">
        <Badge
          className={`text-[10px] uppercase tracking-wider font-semibold ${
            region.type === 'muscle'
              ? 'bg-indigo-500 text-white'
              : 'bg-emerald-500 text-white'
          }`}
        >
          {region.type}
        </Badge>
        <span className="text-xs font-bold text-slate-100">{region.label}</span>
      </div>

      {exerciseCount !== undefined && (
        <div className="flex items-center gap-1 text-xs text-indigo-200 font-medium">
          <Dumbbell className="w-3.5 h-3.5" />
          <span>{exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}</span>
        </div>
      )}
    </div>
  );
}
