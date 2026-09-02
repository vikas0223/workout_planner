'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Check, X, Info } from 'lucide-react';
import { WorkoutAdaptationDecision, ExerciseAdaptationProposal } from '@/lib/domain/adaptive';
import { AdaptiveDiffBadge } from './adaptive-diff-badge';

interface AdaptiveReviewCardProps {
  decision: WorkoutAdaptationDecision;
  onAccept: (decision: WorkoutAdaptationDecision) => void;
  onDecline: () => void;
  className?: string;
}

export function AdaptiveReviewCard({
  decision,
  onAccept,
  onDecline,
  className = '',
}: AdaptiveReviewCardProps) {
  if (!decision.hasAdaptations || decision.exerciseProposals.length === 0) {
    return null;
  }

  const formatPrescription = (p: ExerciseAdaptationProposal['originalPrescription']) => {
    const parts = [`${p.sets} sets`, `${p.reps} reps`];
    if (p.targetWeightKg !== undefined) {
      parts.push(`@ ${p.targetWeightKg} kg`);
    }
    if (p.variationName) {
      parts.push(`(${p.variationName})`);
    }
    return parts.join(' × ');
  };

  return (
    <Card
      className={`border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 shadow-sm overflow-hidden ${className}`}
    >
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header Banner */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-100 dark:border-indigo-950 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Adaptive Training Calibrations Available
                </h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  {decision.exerciseProposals.length} Suggested
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {decision.summaryText}
              </p>
            </div>
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-3 pt-1">
          {decision.exerciseProposals.map((proposal) => (
            <div
              key={proposal.exerciseId}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {proposal.exerciseName}
                </span>
                <AdaptiveDiffBadge action={proposal.action} />
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                    Original Planned
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatPrescription(proposal.originalPrescription)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    Adapted Suggestion
                  </span>
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">
                    {formatPrescription(proposal.adaptedPrescription)}
                  </span>
                </div>
              </div>

              {/* Rationale explanation */}
              <div className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{proposal.rationale}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDecline}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
            aria-label="Keep original workout prescription without adaptations"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Keep Original Plan
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onAccept(decision)}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
            aria-label="Accept all adapted exercise prescriptions"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Accept Adaptations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
