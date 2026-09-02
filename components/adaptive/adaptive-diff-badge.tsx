'use client';

import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, RefreshCw, Layers } from 'lucide-react';
import { AdaptationAction } from '@/lib/domain/adaptive';

interface AdaptiveDiffBadgeProps {
  action: AdaptationAction;
  text?: string;
  className?: string;
}

export function AdaptiveDiffBadge({ action, text, className = '' }: AdaptiveDiffBadgeProps) {
  let label = text;
  let icon = <Sparkles className="w-3 h-3 text-indigo-500" />;
  let colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';

  switch (action) {
    case 'increase_load':
      label = label || 'Load Progression';
      icon = <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      break;
    case 'decrease_load':
      label = label || 'Form Optimization';
      icon = <TrendingDown className="w-3 h-3 text-amber-600 dark:text-amber-400" />;
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      break;
    case 'increase_reps':
      label = label || 'Rep Progression';
      icon = <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      break;
    case 'progress_variation':
      label = label || 'Variation Progression';
      icon = <RefreshCw className="w-3 h-3 text-purple-600 dark:text-purple-400" />;
      colorStyles = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      break;
    case 'decrease_sets':
      label = label || 'Fatigue Calibration';
      icon = <Layers className="w-3 h-3 text-sky-600 dark:text-sky-400" />;
      colorStyles = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
      break;
    case 'anchor_weaker_side':
      label = label || 'Unilateral Balance';
      icon = <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />;
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      break;
    default:
      label = label || 'Adapted';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colorStyles} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
