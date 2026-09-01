/**
 * Anatomy Controls Toolbar Component
 * 
 * Segmented toggles for Mode (Muscle/Joint), View (Front/Back), Sex (Male/Female),
 * and Clear Selection action.
 */

'use client';

import React from 'react';
import { BodySex, BodyView, AnatomyMode } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Activity, Disc } from 'lucide-react';

export interface AnatomyControlsProps {
  mode: AnatomyMode;
  sex: BodySex;
  view: BodyView;
  hasSelection: boolean;
  onModeChange: (mode: AnatomyMode) => void;
  onSexChange: (sex: BodySex) => void;
  onViewChange: (view: BodyView) => void;
  onClearSelection: () => void;
}

export function AnatomyControls({
  mode,
  sex,
  view,
  hasSelection,
  onModeChange,
  onSexChange,
  onViewChange,
  onClearSelection,
}: AnatomyControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs">
      {/* 1. Mode Toggle (Muscles vs Joints) */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => onModeChange('muscle')}
          aria-pressed={mode === 'muscle'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'muscle'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Muscles</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('joint')}
          aria-pressed={mode === 'joint'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'joint'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>Joints</span>
        </button>
      </div>

      {/* 2. View Toggle (Front vs Back) */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => onViewChange('front')}
          aria-pressed={view === 'front'}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            view === 'front'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Front View
        </button>

        <button
          type="button"
          onClick={() => onViewChange('back')}
          aria-pressed={view === 'back'}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            view === 'back'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Back View
        </button>
      </div>

      {/* 3. Sex Toggle (Male vs Female) & Reset */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onSexChange('male')}
            aria-pressed={sex === 'male'}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sex === 'male'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Male
          </button>
          <button
            type="button"
            onClick={() => onSexChange('female')}
            aria-pressed={sex === 'female'}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sex === 'female'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Female
          </button>
        </div>

        {hasSelection && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            aria-label="Clear selected anatomy region"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
