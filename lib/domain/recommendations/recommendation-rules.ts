/**
 * Pure Deterministic Recommendation Rules
 *
 * Rules:
 * - Pure deterministic evaluation from RecommendationContext.
 * - Zero direct I/O, storage, or browser APIs.
 * - Strict non-medical language (no diagnosing overtraining, injury, or fatigue syndromes).
 * - Contextual progression (equipment-aware, goal-aware, bodyweight-aware).
 * - Substitution learning derived directly from canonical WorkoutSession/SessionExercise records.
 */

import {
  RecommendationContext,
  RecommendationRuleResult,
} from './recommendation-types';
import { WorkoutSession, SessionExercise, WorkoutSet } from '@/types/domain';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';

export class RecommendationRules {
  /**
   * 1. Load Progression Rule
   * Context: User consistently achieves or exceeds target reps with manageable effort.
   */
  public static evaluateLoadProgression(context: RecommendationContext): RecommendationRuleResult[] {
    const results: RecommendationRuleResult[] = [];
    if (!context.recentSessions || context.recentSessions.length === 0) {
      return results;
    }

    const completedSessions = context.recentSessions
      .filter((s) => s.status === 'completed')
      .slice(0, 10);

    if (completedSessions.length < 2) {
      return results;
    }

    // Group completed session exercises by exerciseId
    const exerciseHistory = new Map<string, { exercise: SessionExercise; sessionDate: string }[]>();
    for (const session of completedSessions) {
      for (const ex of session.exercises) {
        if (ex.status !== 'completed' && ex.sets.length === 0) continue;
        const list = exerciseHistory.get(ex.exerciseId) || [];
        list.push({ exercise: ex, sessionDate: session.completedAt || session.startedAt });
        exerciseHistory.set(ex.exerciseId, list);
      }
    }

    const isStrengthOrHypertrophy =
      !context.userProfile?.primaryGoal ||
      context.userProfile.primaryGoal === 'strength' ||
      context.userProfile.primaryGoal === 'hypertrophy';

    for (const [exerciseId, occurrences] of exerciseHistory.entries()) {
      if (occurrences.length < 2) continue;

      const lastTwo = occurrences.slice(0, 2);
      const exMeta = ExerciseCatalog.getExerciseById(exerciseId);
      const isBodyweight =
        exMeta?.equipment.includes('bodyweight') ||
        lastTwo[0].exercise.equipment?.includes('bodyweight');

      let allClean = true;
      let averageWeight = 0;
      let lastReps = 0;

      for (const item of lastTwo) {
        const completedSets = item.exercise.sets.filter((s) => !s.deletedAt && s.status === 'completed');
        if (completedSets.length === 0) {
          allClean = false;
          break;
        }

        // Check if sets met target reps without high failure RPE
        const hasFailedReps = completedSets.some((s) => {
          const actualReps = s.actualReps ?? 0;
          const targetReps = s.targetReps ?? actualReps;
          return actualReps < targetReps || (s.rpe !== undefined && s.rpe >= 9.5);
        });

        if (hasFailedReps) {
          allClean = false;
          break;
        }

        const validSets = completedSets.filter((s) => (s.actualWeight ?? 0) > 0);
        if (validSets.length > 0) {
          averageWeight = validSets[0].actualWeight ?? 0;
        }
        lastReps = completedSets[0].actualReps ?? 0;
      }

      if (!allClean) continue;

      const exName = exMeta?.name || lastTwo[0].exercise.name || 'Exercise';

      if (isBodyweight) {
        // Bodyweight progression: reps or variation
        results.push({
          eligible: true,
          candidate: {
            category: 'progress_load',
            ruleId: 'rule_bodyweight_progression',
            title: `Progress ${exName}`,
            description: `You've mastered your target reps for ${exName}. Try adding 1–2 reps or increasing tempo control.`,
            explanation: `Completed all target reps cleanly across your last 2 sessions.`,
            confidence: occurrences.length >= 3 ? 'high' : 'medium',
            evidence: {
              summary: `Clean execution across ${occurrences.length} recent sessions`,
              sourceSessionsCount: occurrences.length,
              relevantExerciseId: exerciseId,
              relevantExerciseName: exName,
            },
            actionPayload: {
              type: 'adjust_reps',
              exerciseId,
              suggestedRepsTarget: lastReps + 2,
            },
            targetEntityId: exerciseId,
            targetMuscleGroups: exMeta?.primaryMuscles || lastTwo[0].exercise.targetMuscles,
            targetEquipment: exMeta?.equipment || lastTwo[0].exercise.equipment,
            difficulty: exMeta?.difficulty || 'intermediate',
          },
          scoreBreakdown: {
            goalAlignment: isStrengthOrHypertrophy ? 25 : 20,
            performance: 25,
            preference: 15,
            consistency: 15,
            recency: 10,
          },
        });
      } else if (averageWeight > 0) {
        // Loaded progression: conservative +2.5kg (or +1.25kg for small movements)
        const isDumbbell = exMeta?.equipment.includes('dumbbell');
        const incrementKg = isDumbbell ? 2.0 : 2.5;

        results.push({
          eligible: true,
          candidate: {
            category: 'progress_load',
            ruleId: 'rule_load_progression',
            title: `Load Progression for ${exName}`,
            description: `You met all target reps in recent sessions. Consider progressing load by +${incrementKg} kg.`,
            explanation: `Completed all target reps in the last 2 sessions with solid execution.`,
            confidence: occurrences.length >= 3 ? 'high' : 'medium',
            evidence: {
              summary: `Consistently completed target reps at ${averageWeight} kg across ${occurrences.length} sessions`,
              sourceSessionsCount: occurrences.length,
              relevantExerciseId: exerciseId,
              relevantExerciseName: exName,
            },
            actionPayload: {
              type: 'increase_weight',
              exerciseId,
              suggestedWeightDeltaKg: incrementKg,
            },
            targetEntityId: exerciseId,
            targetMuscleGroups: exMeta?.primaryMuscles || lastTwo[0].exercise.targetMuscles,
            targetEquipment: exMeta?.equipment || lastTwo[0].exercise.equipment,
            difficulty: exMeta?.difficulty || 'intermediate',
          },
          scoreBreakdown: {
            goalAlignment: isStrengthOrHypertrophy ? 30 : 20,
            performance: 25,
            preference: 15,
            consistency: 15,
            recency: 10,
          },
        });
      }
    }

    return results;
  }

  /**
   * 2. Load Reduction Rule
   * Context: User repeatedly misses reps, reports high RPE (>=9.5), or low ratings.
   */
  public static evaluateLoadReduction(context: RecommendationContext): RecommendationRuleResult[] {
    const results: RecommendationRuleResult[] = [];
    if (!context.recentSessions || context.recentSessions.length === 0) {
      return results;
    }

    const latestSessions = context.recentSessions
      .filter((s) => s.status === 'completed' || s.status === 'active')
      .slice(0, 5);

    for (const session of latestSessions) {
      for (const ex of session.exercises) {
        const completedSets = ex.sets.filter((s) => !s.deletedAt && s.status === 'completed');
        if (completedSets.length < 2) continue;

        let failedSetCount = 0;
        let highRpeCount = 0;
        let highestWeight = 0;

        for (const s of completedSets) {
          if (s.actualWeight && s.actualWeight > highestWeight) {
            highestWeight = s.actualWeight;
          }
          if (s.targetReps !== undefined && s.actualReps !== undefined && s.actualReps < s.targetReps) {
            failedSetCount++;
          }
          if (s.rpe !== undefined && s.rpe >= 9.5) {
            highRpeCount++;
          }
        }

        if (failedSetCount >= 2 || highRpeCount >= 2) {
          const exMeta = ExerciseCatalog.getExerciseById(ex.exerciseId);
          const exName = exMeta?.name || ex.name || 'Exercise';

          results.push({
            eligible: true,
            candidate: {
              category: 'reduce_load',
              ruleId: 'rule_load_reduction',
              title: `Optimize Form on ${exName}`,
              description: `Consider reducing the load slightly (5%–10%) to reinforce clean form and full range of motion.`,
              explanation: `Observed ${failedSetCount > 0 ? `${failedSetCount} sets below target reps` : 'consistently near-maximal RPE'} in your recent session.`,
              confidence: failedSetCount >= 2 && highRpeCount >= 1 ? 'high' : 'medium',
              evidence: {
                summary: `${failedSetCount} missed rep sets / ${highRpeCount} high RPE sets on ${exName}`,
                relevantExerciseId: ex.exerciseId,
                relevantExerciseName: exName,
              },
              actionPayload: {
                type: 'reduce_weight',
                exerciseId: ex.exerciseId,
                suggestedWeightDeltaKg: highestWeight > 0 ? Math.round(highestWeight * 0.075 * 2) / 2 : 2.5,
              },
              targetEntityId: ex.exerciseId,
              targetMuscleGroups: exMeta?.primaryMuscles || ex.targetMuscles,
              targetEquipment: exMeta?.equipment || ex.equipment,
            },
            scoreBreakdown: {
              goalAlignment: 20,
              performance: 25,
              preference: 10,
              consistency: 10,
              recency: 10,
            },
          });
        }
      }
    }

    return results;
  }

  /**
   * 3. Substitution Preference Learning Rule
   * Context: Derived directly from canonical WorkoutSession -> SessionExercise substitutedFromExerciseId.
   */
  public static evaluateSubstitutionPreference(context: RecommendationContext): RecommendationRuleResult[] {
    const results: RecommendationRuleResult[] = [];
    if (!context.recentSessions || context.recentSessions.length === 0) {
      return results;
    }

    // Map: originalExerciseId -> Map(replacementExerciseId -> count)
    const substitutionMap = new Map<string, Map<string, { count: number; replacementName: string; originalName?: string }>>();

    for (const session of context.recentSessions) {
      for (const ex of session.exercises) {
        if (ex.substitutedFromExerciseId && ex.substitutedFromExerciseId !== ex.exerciseId) {
          const originalId = ex.substitutedFromExerciseId;
          const replacementId = ex.exerciseId;

          let targetMap = substitutionMap.get(originalId);
          if (!targetMap) {
            targetMap = new Map();
            substitutionMap.set(originalId, targetMap);
          }

          const existing = targetMap.get(replacementId) || {
            count: 0,
            replacementName: ex.name,
          };
          existing.count++;
          targetMap.set(replacementId, existing);
        }
      }
    }

    const MIN_OBSERVATION_THRESHOLD = 2;

    for (const [originalId, replacements] of substitutionMap.entries()) {
      for (const [replacementId, data] of replacements.entries()) {
        if (data.count >= MIN_OBSERVATION_THRESHOLD) {
          const originalMeta = ExerciseCatalog.getExerciseById(originalId);
          const replacementMeta = ExerciseCatalog.getExerciseById(replacementId);

          const origName = originalMeta?.name || 'the original exercise';
          const repName = replacementMeta?.name || data.replacementName || 'Preferred Alternative';

          results.push({
            eligible: true,
            candidate: {
              category: 'swap_exercise',
              ruleId: 'rule_substitution_preference',
              title: `Preferred Swap: ${repName}`,
              description: `You frequently substitute ${origName} with ${repName}. Would you like to use ${repName} as your default?`,
              explanation: `You have chosen ${repName} over ${origName} in ${data.count} recent workouts.`,
              confidence: data.count >= 3 ? 'high' : 'medium',
              evidence: {
                summary: `${data.count} substitutions of ${origName} -> ${repName}`,
                sourceSessionsCount: data.count,
                relevantExerciseId: originalId,
                relevantExerciseName: origName,
              },
              actionPayload: {
                type: 'substitute_exercise',
                exerciseId: originalId,
                replacementExerciseId: replacementId,
              },
              targetEntityId: originalId,
              targetMuscleGroups: replacementMeta?.primaryMuscles || originalMeta?.primaryMuscles,
              targetEquipment: replacementMeta?.equipment || originalMeta?.equipment,
            },
            scoreBreakdown: {
              goalAlignment: 20,
              performance: 15,
              preference: 20,
              consistency: 10,
              recency: 10,
            },
          });
        }
      }
    }

    return results;
  }

  /**
   * 4. Muscle Balance Rule
   * Context: Derived from ProgressAnalytics muscle distribution.
   */
  public static evaluateMuscleBalance(context: RecommendationContext): RecommendationRuleResult[] {
    const results: RecommendationRuleResult[] = [];
    if (!context.progressMetrics || !context.progressMetrics.muscleDistribution) {
      return results;
    }

    const dist = context.progressMetrics.muscleDistribution;
    if (dist.length < 2) return results;

    const totalVolume = dist.reduce((acc, m) => acc + m.weightedSets, 0);
    if (totalVolume < 10) return results; // need baseline sets

    // Check for major muscle group deficits (< 8% of total sets)
    const majorGroups = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Arms', 'Core'];
    const underworked = dist.filter(
      (m) => majorGroups.some((g) => m.muscleName.toLowerCase().includes(g.toLowerCase())) && m.percentage < 8
    );

    if (underworked.length > 0) {
      const target = underworked[0];
      results.push({
        eligible: true,
        candidate: {
          category: 'choose_workout',
          ruleId: 'rule_muscle_balance',
          title: `Focus on ${target.muscleName}`,
          description: `Your ${target.muscleName} volume has been lower than other muscle groups recently. Consider adding focused exercises in your next session.`,
          explanation: `${target.muscleName} accounted for only ${Math.round(target.percentage)}% of your recent training volume.`,
          confidence: totalVolume >= 20 ? 'high' : 'medium',
          evidence: {
            summary: `${target.muscleName} at ${Math.round(target.percentage)}% of ${totalVolume} total weighted sets`,
            metricReference: `${target.weightedSets} sets logged`,
          },
          actionPayload: {
            type: 'view_schedule',
            navigationTarget: '/workout',
          },
          targetMuscleGroups: [target.muscleName],
        },
        scoreBreakdown: {
          goalAlignment: 25,
          performance: 15,
          preference: 15,
          consistency: 10,
          recency: 5,
        },
      });
    }

    return results;
  }

  /**
   * 5. Consistency Nudge Rule
   * Context: User is below their weekly target workout frequency.
   */
  public static evaluateConsistency(context: RecommendationContext): RecommendationRuleResult[] {
    const results: RecommendationRuleResult[] = [];
    if (!context.progressMetrics) return results;

    const target = context.progressMetrics.weeklyTarget || 3;
    const completedThisWeek = context.progressMetrics.weeklyCompletedCount || 0;

    // Only nudge if below target and past mid-week (Wednesday to Sunday)
    const currentDay = context.currentTime ? new Date(context.currentTime).getDay() : new Date().getDay();
    const isLateInWeek = currentDay === 0 || currentDay >= 3; // Sun, Wed, Thu, Fri, Sat

    if (isLateInWeek && completedThisWeek < target) {
      const remaining = target - completedThisWeek;
      results.push({
        eligible: true,
        candidate: {
          category: 'consistency',
          ruleId: 'rule_weekly_consistency',
          title: `Weekly Goal: ${remaining} Session${remaining > 1 ? 's' : ''} to Go`,
          description: `You've completed ${completedThisWeek} of ${target} workouts this week. A quick session will keep your streak intact.`,
          explanation: `Currently at ${completedThisWeek}/${target} workouts for the current week.`,
          confidence: 'high',
          evidence: {
            summary: `${completedThisWeek}/${target} weekly workouts completed`,
            metricReference: `Weekly Target: ${target}`,
          },
          actionPayload: {
            type: 'view_schedule',
            navigationTarget: '/workout',
          },
        },
        scoreBreakdown: {
          goalAlignment: 25,
          performance: 10,
          preference: 10,
          consistency: 30,
          recency: 10,
        },
      });
    }

    return results;
  }

  /**
   * 6. Recovery & Deload Suggestion Rule
   * Context: Non-medical suggestion when recent feedback indicates high fatigue or difficulty.
   */
  public static evaluateRecovery(context: RecommendationContext): RecommendationRuleResult[] {
    const results: RecommendationRuleResult[] = [];
    const feedbackList = context.recentFeedback || [];
    const recentSessions = (context.recentSessions || []).filter((s) => s.status === 'completed');

    if (recentSessions.length === 0) return results;

    // Check recent ratings / feedback
    const lowRatingCount = feedbackList.slice(0, 3).filter((f) => f.rating <= 2).length;

    // Check if user trained heavily 3 consecutive days
    const recentDates = recentSessions.slice(0, 3).map((s) => new Date(s.completedAt || s.startedAt).toDateString());
    const uniqueDays = new Set(recentDates).size;
    const hasThreeConsecutive = uniqueDays >= 3;

    if (lowRatingCount >= 2 || hasThreeConsecutive) {
      results.push({
        eligible: true,
        candidate: {
          category: 'recovery_day',
          ruleId: 'rule_active_recovery',
          title: `Active Recovery or Rest Day`,
          description: `Consider taking a light mobility day or active rest to allow your body to recharge and recover.`,
          explanation: lowRatingCount >= 2
            ? `Your recent session feedback indicated high difficulty/fatigue.`
            : `You've logged ${uniqueDays} workouts in consecutive days.`,
          confidence: 'high',
          evidence: {
            summary: lowRatingCount >= 2 ? `Low ratings on recent workouts` : `${uniqueDays} consecutive workout days`,
          },
          actionPayload: {
            type: 'start_recovery_session',
            navigationTarget: '/programs',
          },
        },
        scoreBreakdown: {
          goalAlignment: 20,
          performance: 15,
          preference: 15,
          consistency: 20,
          recency: 10,
        },
      });
    }

    return results;
  }

  /**
   * 7. Active Program Day Progression Rule
   * Context: Active program exists and has an upcoming scheduled day.
   */
  public static evaluateProgramProgression(context: RecommendationContext): RecommendationRuleResult[] {
    const results: RecommendationRuleResult[] = [];
    if (!context.activeProgram || context.activeProgram.status !== 'active') {
      return results;
    }

    const program = context.activeProgram;
    // Find first incomplete or scheduled day
    let nextDay: { weekNumber: number; day: any } | null = null;

    for (const week of program.weeks) {
      for (const day of week.days) {
        if (day.status === 'planned' || day.status === 'rescheduled') {
          nextDay = { weekNumber: week.weekNumber, day };
          break;
        }
      }
      if (nextDay) break;
    }

    if (nextDay) {
      const dayLabel = nextDay.day.label || `Day ${nextDay.day.dayNumber}`;
      results.push({
        eligible: true,
        candidate: {
          category: 'choose_workout',
          ruleId: 'rule_program_next_day',
          title: `Next Up: ${program.name} — ${dayLabel}`,
          description: `Continue your ${program.name} program (Week ${nextDay.weekNumber}, ${dayLabel}).`,
          explanation: `Your next planned session in your active training program.`,
          confidence: 'high',
          evidence: {
            summary: `Program "${program.name}" is active`,
            metricReference: `Week ${nextDay.weekNumber}, Day ${nextDay.day.dayNumber}`,
          },
          actionPayload: {
            type: 'start_program_day',
            programId: program.id,
            programDayId: nextDay.day.id,
            navigationTarget: `/programs/${program.id}`,
          },
          targetEntityId: program.id,
        },
        scoreBreakdown: {
          goalAlignment: 30,
          performance: 20,
          preference: 20,
          consistency: 20,
          recency: 10,
        },
      });
    }

    return results;
  }

  /**
   * 8. Goal Alignment Rule
   * Context: Evaluates active fitness goals and surfaces progression steps.
   */
  public static evaluateGoalAlignment(context: RecommendationContext): RecommendationRuleResult[] {
    const results: RecommendationRuleResult[] = [];
    if (!context.goals || context.goals.length === 0) return results;

    const activeGoals = context.goals.filter((g) => g.status === 'active');
    if (activeGoals.length === 0) return results;

    const topGoal = activeGoals[0];
    const goalName = topGoal.label || `${topGoal.type.replace('_', ' ')} target`;

    results.push({
      eligible: true,
      candidate: {
        category: 'goal_alignment',
        ruleId: 'rule_goal_alignment',
        title: `Goal Target: ${goalName}`,
        description: `Stay on track towards your ${topGoal.targetValue} ${topGoal.unit} target by keeping your current pace.`,
        explanation: `Aligned with your active ${goalName} milestone.`,
        confidence: 'medium',
        evidence: {
          summary: `Active goal target: ${topGoal.targetValue} ${topGoal.unit}`,
          metricReference: `Target: ${topGoal.targetValue} ${topGoal.unit}`,
        },
        actionPayload: {
          type: 'view_goal',
          goalId: topGoal.id,
          navigationTarget: '/goals',
        },
        targetEntityId: topGoal.id,
      },
      scoreBreakdown: {
        goalAlignment: 30,
        performance: 15,
        preference: 15,
        consistency: 20,
        recency: 10,
      },
    });

    return results;
  }
}
