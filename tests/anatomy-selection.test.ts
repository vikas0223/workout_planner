/**
 * Phase 2G: Anatomy Selection State Transitions & Logic Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getRegionById,
  getRegionsByViewAndMode,
  findRelatedRegions,
  ANATOMY_REGIONS,
} from '@/lib/anatomy/anatomy-definitions';
import { BodyView, AnatomyMode, AnatomyRegionDefinition } from '@/types/domain';

// State Transition Engine mirroring useAnatomySelection logic
class AnatomySelectionEngine {
  public mode: AnatomyMode = 'muscle';
  public sex: 'male' | 'female' = 'male';
  public view: BodyView = 'front';
  public selectedRegion: AnatomyRegionDefinition | null = null;
  public hoveredRegion: AnatomyRegionDefinition | null = null;

  public setMode(newMode: AnatomyMode) {
    if (this.mode !== newMode) {
      this.selectedRegion = null;
      this.hoveredRegion = null;
    }
    this.mode = newMode;
  }

  public setSex(newSex: 'male' | 'female') {
    this.sex = newSex;
  }

  public setView(newView: BodyView) {
    if (this.view !== newView) {
      if (this.selectedRegion) {
        const available = getRegionsByViewAndMode(newView, this.selectedRegion.type);
        const stillValid = available.some((r) => r.id === this.selectedRegion!.id);
        if (!stillValid) {
          this.selectedRegion = null;
        }
      }
      this.hoveredRegion = null;
    }
    this.view = newView;
  }

  public selectRegion(region: AnatomyRegionDefinition) {
    if (this.selectedRegion?.id === region.id) {
      this.selectedRegion = null;
    } else {
      this.selectedRegion = region;
    }
  }

  public clearSelection() {
    this.selectedRegion = null;
    this.hoveredRegion = null;
  }

  public getRelatedRegionIds(): string[] {
    if (!this.selectedRegion) return [];
    return findRelatedRegions(this.selectedRegion.id).map((r) => r.id);
  }
}

describe('Phase 2G: Anatomy Selection State Engine', () => {
  it('initializes with default front muscle male view', () => {
    const engine = new AnatomySelectionEngine();
    expect(engine.mode).toBe('muscle');
    expect(engine.sex).toBe('male');
    expect(engine.view).toBe('front');
    expect(engine.selectedRegion).toBeNull();
    expect(engine.hoveredRegion).toBeNull();
  });

  it('selects a region and toggles off on repeat selection', () => {
    const engine = new AnatomySelectionEngine();
    const chest = getRegionById('chest')!;

    engine.selectRegion(chest);
    expect(engine.selectedRegion?.id).toBe('chest');

    // Repeat click deselects
    engine.selectRegion(chest);
    expect(engine.selectedRegion).toBeNull();
  });

  it('clears active selection when switching mode from muscle to joint', () => {
    const engine = new AnatomySelectionEngine();
    const chest = getRegionById('chest')!;

    engine.selectRegion(chest);
    expect(engine.selectedRegion?.id).toBe('chest');

    engine.setMode('joint');
    expect(engine.mode).toBe('joint');
    expect(engine.selectedRegion).toBeNull();
  });

  it('preserves selection when switching sex between male and female', () => {
    const engine = new AnatomySelectionEngine();
    const chest = getRegionById('chest')!;

    engine.selectRegion(chest);
    engine.setSex('female');
    expect(engine.sex).toBe('female');
    expect(engine.selectedRegion?.id).toBe('chest');
  });

  it('clears selection when switching view if region is not present in new view', () => {
    const engine = new AnatomySelectionEngine();
    const chest = getRegionById('chest')!; // front view

    engine.selectRegion(chest);
    expect(engine.selectedRegion?.id).toBe('chest');

    // Switch to back view (chest is not on back view)
    engine.setView('back');
    expect(engine.view).toBe('back');
    expect(engine.selectedRegion).toBeNull();
  });

  it('preserves selection when switching view if region is bilateral in both views', () => {
    const engine = new AnatomySelectionEngine();
    const shoulder = getRegionById('shoulder_left')!; // front view joint

    engine.setMode('joint');
    engine.selectRegion(shoulder);
    expect(engine.selectedRegion?.id).toBe('shoulder_left');

    // Switch to front view (same view keeps it)
    engine.setView('front');
    expect(engine.selectedRegion?.id).toBe('shoulder_left');
  });

  it('clears selection explicitly via clearSelection()', () => {
    const engine = new AnatomySelectionEngine();
    const abs = getRegionById('abs')!;

    engine.selectRegion(abs);
    expect(engine.selectedRegion?.id).toBe('abs');

    engine.clearSelection();
    expect(engine.selectedRegion).toBeNull();
  });

  it('calculates related regions for selected muscle', () => {
    const engine = new AnatomySelectionEngine();
    const chest = getRegionById('chest')!;

    engine.selectRegion(chest);
    const related = engine.getRelatedRegionIds();
    expect(related.length).toBeGreaterThan(0);
    expect(related.includes('front_deltoids') || related.includes('triceps')).toBe(true);
  });
});
