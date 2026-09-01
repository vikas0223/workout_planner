'use client';

/**
 * usePrograms Hook
 * Reactive state and operations for Training Programs, adherence tracking,
 * day rescheduling, and platform catalog adoption.
 */

import { useState, useEffect, useCallback } from 'react';
import { Program, ProgramDay, ProgramWeek } from '@/types/domain';
import { ProgramService, ProgramAdherenceMetrics } from '@/lib/domain/program-service';
import { LocalProgramRepository, LocalCompletionRepository, LocalWorkoutRepository } from '@/lib/repositories/local';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';
import { PLATFORM_PROGRAM_CATALOG, CatalogProgramDefinition } from '@/lib/domain/platform-catalogs';

export function usePrograms(userId?: string) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [adherence, setAdherence] = useState<ProgramAdherenceMetrics | null>(null);
  const [todaysDay, setTodaysDay] = useState<{ week: ProgramWeek; day: ProgramDay } | null>(null);
  const [loading, setLoading] = useState(true);

  const programRepo = new LocalProgramRepository();
  const workoutRepo = new LocalWorkoutRepository();
  const completionRepo = new LocalCompletionRepository();
  const service = new ProgramService(programRepo, workoutRepo, completionRepo);

  const loadData = useCallback(async () => {
    try {
      const list = await programRepo.listPrograms(userId);
      setPrograms(list);

      const active = list.find((p) => p.status === 'active') || null;
      setActiveProgram(active);

      if (active) {
        const adh = service.calculateAdherence(active);
        setAdherence(adh);
        const today = service.getTodaysProgramDay(active);
        setTodaysDay(today);
      } else {
        setAdherence(null);
        setTodaysDay(null);
      }
    } catch (err) {
      console.error('[usePrograms] Error loading programs:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();

    const bus = ProgressInvalidationBus.getInstance();
    const unsubscribe = bus.subscribe((event) => {
      if (
        event.type === 'program_changed' ||
        event.type === 'session_changed' ||
        event.type === 'sync_applied'
      ) {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  const adoptProgram = async (catalogId: string, startDateStr?: string) => {
    setLoading(true);
    try {
      const adopted = await service.adoptProgram(catalogId, userId, startDateStr);
      await loadData();
      return adopted;
    } finally {
      setLoading(false);
    }
  };

  const rescheduleDay = async (dayId: string, newEffectiveDateStr: string, notes?: string) => {
    const updated = await service.rescheduleDay(dayId, newEffectiveDateStr, notes);
    await loadData();
    return updated;
  };

  const skipDay = async (dayId: string, notes?: string) => {
    const updated = await service.skipDay(dayId, notes);
    await loadData();
    return updated;
  };

  const setActive = async (programId: string) => {
    const all = await programRepo.listPrograms(userId);
    for (const p of all) {
      if (p.status === 'active' && p.id !== programId) {
        p.status = 'paused';
        await programRepo.saveProgram(p);
      }
    }
    const target = await programRepo.getProgramById(programId);
    if (target) {
      target.status = 'active';
      await programRepo.saveProgram(target);
      await loadData();
    }
  };

  const pauseProgram = async (programId: string) => {
    const target = await programRepo.getProgramById(programId);
    if (target) {
      target.status = 'paused';
      await programRepo.saveProgram(target);
      await loadData();
    }
  };

  const deleteProgram = async (programId: string) => {
    await programRepo.deleteProgram(programId);
    await loadData();
  };

  const saveCustomProgram = async (program: Program) => {
    await programRepo.saveProgram(program);
    await loadData();
  };

  return {
    programs,
    activeProgram,
    adherence,
    todaysDay,
    loading,
    catalogPrograms: PLATFORM_PROGRAM_CATALOG,
    adoptProgram,
    rescheduleDay,
    skipDay,
    setActive,
    pauseProgram,
    deleteProgram,
    saveCustomProgram,
    refresh: loadData,
  };
}
