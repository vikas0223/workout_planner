/**
 * Mobile Filter Drawer Component
 * 
 * Accessible slide-over / sheet for mobile screen widths (< 768px).
 */

'use client';

import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseFilters, ExerciseFiltersProps } from './exercise-filters';

export interface ExerciseFilterDrawerProps extends ExerciseFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  totalResults: number;
}

export function ExerciseFilterDrawer({
  isOpen,
  onClose,
  totalResults,
  ...filterProps
}: ExerciseFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filter-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity"
    >
      <div
        className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 motion-reduce:animate-none"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h2 id="mobile-filter-title" className="text-base font-bold text-slate-900">
              Filter Exercises
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close filters"
            className="h-8 w-8 p-0 rounded-full text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <ExerciseFilters {...filterProps} />
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-slate-300"
            onClick={filterProps.onClearAll}
          >
            Reset
          </Button>
          <Button
            type="button"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            onClick={onClose}
          >
            Show {totalResults} Results
          </Button>
        </div>
      </div>
    </div>
  );
}
