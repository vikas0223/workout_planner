/**
 * Phase 2G: Anatomy Definitions & Taxonomy Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ANATOMY_REGIONS,
  getRegionsByViewAndMode,
  getRegionById,
  findRelatedRegions,
} from '@/lib/anatomy/anatomy-definitions';

describe('Phase 2G: Anatomy Definitions Validation', () => {
  it('ensures exact count of 40 anatomy region definitions (17 muscles + 23 joints)', () => {
    expect(ANATOMY_REGIONS.length).toBe(40);
    const ids = ANATOMY_REGIONS.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(40);
  });

  it('ensures exactly 17 muscle regions (8 front, 9 back)', () => {
    const muscles = ANATOMY_REGIONS.filter((r) => r.type === 'muscle');
    expect(muscles.length).toBe(17);

    const frontMuscles = getRegionsByViewAndMode('front', 'muscle');
    expect(frontMuscles.length).toBe(8);

    const backMuscles = getRegionsByViewAndMode('back', 'muscle');
    expect(backMuscles.length).toBe(9);

    for (const m of muscles) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(['front', 'back']).toContain(m.view);
      expect(m.catalogMuscles).toBeDefined();
      expect(m.catalogMuscles!.length).toBeGreaterThan(0);
    }
  });

  it('ensures exactly 23 joint articulation regions (13 front, 10 back)', () => {
    const joints = ANATOMY_REGIONS.filter((r) => r.type === 'joint');
    expect(joints.length).toBe(23);

    const frontJoints = getRegionsByViewAndMode('front', 'joint');
    expect(frontJoints.length).toBe(13);

    const backJoints = getRegionsByViewAndMode('back', 'joint');
    expect(backJoints.length).toBe(10);

    for (const j of joints) {
      expect(j.label.length).toBeGreaterThan(0);
      expect(['front', 'back']).toContain(j.view);
      expect(j.catalogJoints).toBeDefined();
      expect(j.catalogJoints!.length).toBeGreaterThan(0);
    }
  });

  it('verifies getRegionsByViewAndMode returns correct partition', () => {
    const frontMuscles = getRegionsByViewAndMode('front', 'muscle');
    expect(frontMuscles.every((r) => r.view === 'front' && r.type === 'muscle')).toBe(true);

    const backMuscles = getRegionsByViewAndMode('back', 'muscle');
    expect(backMuscles.every((r) => r.view === 'back' && r.type === 'muscle')).toBe(true);

    const frontJoints = getRegionsByViewAndMode('front', 'joint');
    expect(frontJoints.every((r) => r.view === 'front' && r.type === 'joint')).toBe(true);

    const backJoints = getRegionsByViewAndMode('back', 'joint');
    expect(backJoints.every((r) => r.view === 'back' && r.type === 'joint')).toBe(true);
  });

  it('retrieves region by ID accurately', () => {
    const chest = getRegionById('chest');
    expect(chest).toBeDefined();
    expect(chest?.label).toBe('Chest / Pectorals');
    expect(chest?.catalogMuscles).toEqual(['Chest']);
  });

  it('finds related regions based on domain metadata', () => {
    const relatedToChest = findRelatedRegions('chest');
    expect(relatedToChest.length).toBeGreaterThan(0);
    expect(relatedToChest.some((r) => r.id === 'front_deltoids' || r.id === 'triceps')).toBe(true);
  });
});
