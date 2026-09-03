'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Program,
  ProgramWeek,
  ProgramDay,
  ProgramDayType,
  WorkoutTemplate,
  ExperienceLevel,
} from '@/types/domain';
import { LocalWorkoutRepository, LocalProgramRepository } from '@/lib/repositories/local';
import {
  Plus,
  Trash2,
  Calendar,
  Dumbbell,
  Moon,
  Sparkles,
  Heart,
  Save,
  ArrowLeft,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export function ProgramBuilder() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('strength');
  const [difficulty, setDifficulty] = useState<ExperienceLevel>('intermediate');
  const [makeActive, setMakeActive] = useState(true);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [weeks, setWeeks] = useState<ProgramWeek[]>([]);
  const [saving, setSaving] = useState(false);

  const workoutRepo = useMemo(() => new LocalWorkoutRepository(), []);
  const programRepo = useMemo(() => new LocalProgramRepository(), []);

  useEffect(() => {
    async function loadTemplates() {
      const list = await workoutRepo.listTemplates();
      setTemplates(list);
    }
    loadTemplates();

    // Default: 4 weeks with 7 days each
    const initialWeeks: ProgramWeek[] = Array.from({ length: 4 }, (_, wIdx) => ({
      id: `pw_builder_${wIdx + 1}`,
      programId: 'new_program',
      weekNumber: wIdx + 1,
      label: `Week ${wIdx + 1}`,
      days: [
        { id: `pd_b_${wIdx + 1}_1`, programId: 'new_program', programWeekId: `pw_builder_${wIdx + 1}`, dayNumber: 1, type: 'workout', label: 'Workout Day A', status: 'planned' },
        { id: `pd_b_${wIdx + 1}_2`, programId: 'new_program', programWeekId: `pw_builder_${wIdx + 1}`, dayNumber: 2, type: 'workout', label: 'Workout Day B', status: 'planned' },
        { id: `pd_b_${wIdx + 1}_3`, programId: 'new_program', programWeekId: `pw_builder_${wIdx + 1}`, dayNumber: 3, type: 'rest', label: 'Rest Day', status: 'planned' },
        { id: `pd_b_${wIdx + 1}_4`, programId: 'new_program', programWeekId: `pw_builder_${wIdx + 1}`, dayNumber: 4, type: 'workout', label: 'Workout Day C', status: 'planned' },
        { id: `pd_b_${wIdx + 1}_5`, programId: 'new_program', programWeekId: `pw_builder_${wIdx + 1}`, dayNumber: 5, type: 'workout', label: 'Workout Day D', status: 'planned' },
        { id: `pd_b_${wIdx + 1}_6`, programId: 'new_program', programWeekId: `pw_builder_${wIdx + 1}`, dayNumber: 6, type: 'mobility', label: 'Mobility Day', status: 'planned' },
        { id: `pd_b_${wIdx + 1}_7`, programId: 'new_program', programWeekId: `pw_builder_${wIdx + 1}`, dayNumber: 7, type: 'rest', label: 'Rest Day', status: 'planned' },
      ],
    }));
    setWeeks(initialWeeks);
  }, [workoutRepo]);

  const handleAddWeek = () => {
    const nextNum = weeks.length + 1;
    const uid = Math.random().toString(36).substring(2, 8);
    const newWeek: ProgramWeek = {
      id: `pw_builder_${uid}`,
      programId: 'new_program',
      weekNumber: nextNum,
      label: `Week ${nextNum}`,
      days: Array.from({ length: 7 }, (_, dIdx) => ({
        id: `pd_b_${uid}_${dIdx + 1}`,
        programId: 'new_program',
        programWeekId: `pw_builder_${uid}`,
        dayNumber: dIdx + 1,
        type: dIdx === 2 || dIdx === 6 ? 'rest' : 'workout',
        label: dIdx === 2 || dIdx === 6 ? 'Rest Day' : `Workout Day ${dIdx + 1}`,
        status: 'planned',
      })),
    };
    setWeeks([...weeks, newWeek]);
  };

  const handleRemoveWeek = (weekNumber: number) => {
    if (weeks.length <= 1) return;
    const filtered = weeks
      .filter((w) => w.weekNumber !== weekNumber)
      .map((w, idx) => ({ ...w, weekNumber: idx + 1, label: `Week ${idx + 1}` }));
    setWeeks(filtered);
  };

  const handleUpdateDay = (
    weekIdx: number,
    dayIdx: number,
    field: keyof ProgramDay,
    value: string
  ) => {
    const updated = [...weeks];
    const targetDay = { ...updated[weekIdx].days[dayIdx], [field]: value };
    updated[weekIdx].days[dayIdx] = targetDay;
    setWeeks(updated);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const now = new Date();
      const programId = `prog_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const startDateStr = now.toISOString();

      const finalizedWeeks: ProgramWeek[] = weeks.map((w, wIdx) => {
        const weekId = `pw_${programId}_w${w.weekNumber}`;
        const days: ProgramDay[] = w.days.map((d) => {
          const dayOffset = wIdx * 7 + (d.dayNumber - 1);
          const dDate = new Date(now);
          dDate.setDate(now.getDate() + dayOffset);
          const dYear = dDate.getFullYear();
          const dMonth = String(dDate.getMonth() + 1).padStart(2, '0');
          const dDay = String(dDate.getDate()).padStart(2, '0');
          const schedStr = `${dYear}-${dMonth}-${dDay}`;

          return {
            ...d,
            id: `pd_${programId}_w${w.weekNumber}_d${d.dayNumber}`,
            programId,
            programWeekId: weekId,
            scheduledDate: schedStr,
            effectiveDate: schedStr,
            status: 'planned',
          };
        });

        return {
          id: weekId,
          programId,
          weekNumber: w.weekNumber,
          label: w.label || `Week ${w.weekNumber}`,
          days,
        };
      });

      const newProgram: Program = {
        id: programId,
        name: name.trim(),
        description: description.trim() || undefined,
        goal,
        difficulty,
        weeks: finalizedWeeks,
        status: makeActive ? 'active' : 'draft',
        startDate: startDateStr,
        currentWeekNumber: 1,
        currentDayNumber: 1,
        isCustom: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await programRepo.saveProgram(newProgram);
      router.push(`/programs/${programId}`);
    } catch (err) {
      console.error('[ProgramBuilder] Error saving program:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/programs"
            aria-label="Back to Programs"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Program Builder</h1>
            <p className="text-xs text-muted-foreground">
              Design a custom multi-week training cycle with progressive scheduling.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveProgram}
          disabled={saving || !name.trim()}
          id="btn-save-custom-program"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save & Publish Program'}
        </button>
      </div>

      <form onSubmit={handleSaveProgram} className="space-y-8">
        {/* General Program Info */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground">Program Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="input-prog-name" className="text-xs font-medium text-foreground">Program Name *</label>
              <input
                id="input-prog-name"
                type="text"
                required
                placeholder="e.g. 8-Week Hypertrophy & Power"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="input-prog-desc" className="text-xs font-medium text-foreground">Description / Focus</label>
              <textarea
                id="input-prog-desc"
                rows={2}
                placeholder="Outline the training philosophy, volume progression, and target outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="select-prog-goal" className="text-xs font-medium text-foreground">Primary Goal</label>
              <select
                id="select-prog-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy (Muscle Gain)</option>
                <option value="endurance">Endurance</option>
                <option value="fat_loss">Fat Loss & Conditioning</option>
                <option value="mobility">Mobility & Longevity</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="select-prog-diff" className="text-xs font-medium text-foreground">Difficulty Level</label>
              <select
                id="select-prog-diff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ExperienceLevel)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="chk-make-active"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="chk-make-active" className="text-xs font-medium text-foreground">
                Set as my active training program immediately upon saving
              </label>
            </div>
          </div>
        </div>

        {/* Multi-Week Day Configurator */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Training Weeks Schedule ({weeks.length} Weeks)</h2>
            <button
              type="button"
              onClick={handleAddWeek}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Another Week
            </button>
          </div>

          {weeks.map((week, wIdx) => (
            <div key={week.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  aria-label={`Label for Week ${week.weekNumber}`}
                  value={week.label || `Week ${week.weekNumber}`}
                  onChange={(e) => {
                    const copy = [...weeks];
                    copy[wIdx].label = e.target.value;
                    setWeeks(copy);
                  }}
                  className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-foreground hover:border-border focus:border-primary focus:outline-none"
                />

                {weeks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWeek(week.weekNumber)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                    title="Delete Week"
                    aria-label={`Delete Week ${week.weekNumber}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 7 Days Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {week.days.map((day, dIdx) => (
                  <div key={day.id} className="rounded-xl border border-border/80 bg-background p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">Day {day.dayNumber}</span>
                      <select
                        aria-label={`Week ${week.weekNumber} Day ${day.dayNumber} Type`}
                        value={day.type}
                        onChange={(e) => handleUpdateDay(wIdx, dIdx, 'type', e.target.value as ProgramDayType)}
                        className="rounded-lg border border-border bg-card px-2 py-0.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="workout">Workout</option>
                        <option value="rest">Rest</option>
                        <option value="mobility">Mobility</option>
                        <option value="recovery">Recovery</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      aria-label={`Week ${week.weekNumber} Day ${day.dayNumber} Label`}
                      placeholder="Day label (e.g. Upper Power)"
                      value={day.label || ''}
                      onChange={(e) => handleUpdateDay(wIdx, dIdx, 'label', e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    {day.type === 'workout' && (
                      <div className="space-y-1">
                        <label htmlFor={`select-tpl-${week.id}-${day.id}`} className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Linked Template
                        </label>
                        <select
                          id={`select-tpl-${week.id}-${day.id}`}
                          aria-label={`Week ${week.weekNumber} Day ${day.dayNumber} Linked Template`}
                          value={day.workoutTemplateId || ''}
                          onChange={(e) => handleUpdateDay(wIdx, dIdx, 'workoutTemplateId', e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- Choose Template --</option>
                          {templates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.name} ({tpl.exercises.length} ex)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
