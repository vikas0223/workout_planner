'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  ariaLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  iconColor = 'text-indigo-600 dark:text-indigo-400',
  iconBg = 'bg-indigo-50 dark:bg-indigo-950/50',
  trend,
  ariaLabel,
}) => {
  return (
    <Card
      className="overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
      tabIndex={0}
      aria-label={ariaLabel || `${label}: ${value} ${unit || ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {value}
              </span>
              {unit && (
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {unit}
                </span>
              )}
            </div>
            {subtext && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                {subtext}
              </p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} shrink-0`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        {trend && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center text-xs font-medium">
            <span
              className={
                trend.positive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }
            >
              {trend.value}
            </span>
            {trend.label && (
              <span className="ml-1 text-slate-500 dark:text-slate-400">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
