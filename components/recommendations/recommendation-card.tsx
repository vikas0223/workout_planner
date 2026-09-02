/**
 * Recommendation Card Component
 *
 * Features:
 * - Clean, accessible presentation with clear category icon and confidence badge.
 * - Factual explanation copy referencing concrete workout evidence.
 * - Primary contextual action and dismiss button.
 * - Keyboard navigable with visible focus states and WCAG AA compliant contrast.
 */

'use client';

import React from 'react';
import { DeterministicRecommendation } from '@/lib/domain/recommendations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  HeartPulse,
  Target,
  Clock,
  X,
  ArrowRight,
  Info,
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: DeterministicRecommendation;
  onApply?: (recommendation: DeterministicRecommendation) => void;
  onDismiss?: (recommendation: DeterministicRecommendation) => void;
  compact?: boolean;
}

export function RecommendationCard({
  recommendation,
  onApply,
  onDismiss,
  compact = false,
}: RecommendationCardProps) {
  const getCategoryIcon = () => {
    switch (recommendation.category) {
      case 'progress_load':
        return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'reduce_load':
        return <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'swap_exercise':
        return <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'choose_workout':
        return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'recovery_day':
        return <HeartPulse className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'goal_alignment':
        return <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'consistency':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getConfidenceBadge = () => {
    switch (recommendation.confidence) {
      case 'high':
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 py-0"
          >
            High Confidence
          </Badge>
        );
      case 'medium':
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 py-0"
          >
            Recommended
          </Badge>
        );
      case 'low':
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 py-0"
          >
            Suggestion
          </Badge>
        );
    }
  };

  const getActionLabel = () => {
    switch (recommendation.actionPayload.type) {
      case 'increase_weight':
      case 'reduce_weight':
      case 'adjust_reps':
        return 'Apply';
      case 'substitute_exercise':
        return 'Swap';
      case 'start_program_day':
        return 'Continue Program';
      case 'start_recovery_session':
        return 'View Recovery';
      case 'view_goal':
        return 'View Goal';
      default:
        return 'Action';
    }
  };

  if (compact) {
    return (
      <div
        className="flex items-center justify-between p-2.5 sm:p-3 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-slate-900 dark:to-slate-800/90 border border-indigo-200/80 dark:border-indigo-900/60 rounded-xl shadow-xs gap-3"
        role="region"
        aria-label="Recommendation"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-950 shrink-0">
            {getCategoryIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {recommendation.title}
              </span>
              {getConfidenceBadge()}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
              {recommendation.explanation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onApply && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onApply(recommendation)}
              className="h-7 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 rounded-lg"
              aria-label={`${getActionLabel()}: ${recommendation.title}`}
            >
              <span>{getActionLabel()}</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss(recommendation)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              aria-label={`Dismiss recommendation: ${recommendation.title}`}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white/95 dark:bg-slate-900/95 border-indigo-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 shrink-0">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {recommendation.title}
                </h4>
                {getConfidenceBadge()}
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Score: {recommendation.score} / 100
              </span>
            </div>
          </div>

          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss(recommendation)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg -mt-1 -mr-1"
              aria-label={`Dismiss recommendation: ${recommendation.title}`}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {recommendation.description}
        </p>

        <div className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <span>{recommendation.explanation}</span>
        </div>

        {onApply && (
          <div className="pt-1 flex justify-end">
            <Button
              size="sm"
              onClick={() => onApply(recommendation)}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
              aria-label={`${getActionLabel()}: ${recommendation.title}`}
            >
              <span>{getActionLabel()}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
