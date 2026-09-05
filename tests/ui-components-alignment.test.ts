/**
 * UI Regression & Systematic Alignment Test Suite (Part V)
 * 
 * Verifies structural tokens and layout constraints across:
 * 1. Workout Wizard (spacing scale, width, 2-column desktop / 1-column mobile, card dimensions)
 * 2. Create Goal Modal (560px max-width, 32px/20px padding, 44px controls, 44x44 close, 2-column rows)
 * 3. Replyf Brand & Logo (correct path, alt text, dimensions)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Part V: UI Components Alignment & Design Token Regression', () => {
  const wizardFile = fs.readFileSync(
    path.resolve(__dirname, '../components/workout/workout-wizard.tsx'),
    'utf-8'
  );
  const goalModalFile = fs.readFileSync(
    path.resolve(__dirname, '../components/goals/create-goal-modal.tsx'),
    'utf-8'
  );
  const authGuestFile = fs.readFileSync(
    path.resolve(__dirname, '../components/auth/auth-guest-screen.tsx'),
    'utf-8'
  );
  const appPageFile = fs.readFileSync(
    path.resolve(__dirname, '../app/page.tsx'),
    'utf-8'
  );

  describe('Workout Wizard Alignment (Part L & M)', () => {
    it('enforces md:max-w-[860px] mx-auto w-full container constraint (full-width on mobile)', () => {
      expect(wizardFile).toContain('md:max-w-[860px]');
      expect(wizardFile).toContain('mx-auto');
    });

    it('enforces wizard systematic vertical spacing scale', () => {
      // Wizard top padding: responsive 24px mobile (pt-6) / 40px desktop (md:pt-10)
      expect(wizardFile).toContain('pt-6');
      expect(wizardFile).toContain('md:pt-10');
      // Progress -> heading: 28px (mt-7)
      expect(wizardFile).toContain('mt-7');
      // Heading -> description: 8px (mt-2)
      expect(wizardFile).toContain('mt-2');
      // Option grid: 16px (gap-4)
      expect(wizardFile).toContain('gap-4');
      // Divider -> footer: 24px (pt-6)
      expect(wizardFile).toContain('pt-6');
    });

    it('enforces responsive 1-column mobile to 2-column desktop option grid', () => {
      expect(wizardFile).toContain('grid-cols-1 sm:grid-cols-2');
      expect(wizardFile).toContain('gap-4');
    });

    it('enforces card baseline dimensions: min-h-[116px], p-5, rounded-2xl', () => {
      expect(wizardFile).toContain('min-h-[116px]');
      expect(wizardFile).toContain('p-5');
      expect(wizardFile).toContain('rounded-2xl');
    });

    it('includes accessible check indicator and focus ring on options', () => {
      expect(wizardFile).toContain('focus-visible:ring-2');
      expect(wizardFile).toContain('focus-visible:ring-indigo-600');
    });
  });

  describe('Create Fitness Goal Modal (Part O, P, Q, R)', () => {
    it('enforces modal width: min(calc(100vw - 32px), 560px)', () => {
      expect(goalModalFile).toContain('min(calc(100vw - 32px), 560px)');
    });

    it('enforces responsive padding: 20px mobile (p-5), 32px desktop (sm:p-8)', () => {
      expect(goalModalFile).toContain('p-5 sm:p-8');
    });

    it('enforces minimum 44x44px close button touch target', () => {
      expect(goalModalFile).toContain('min-h-[44px]');
      expect(goalModalFile).toContain('min-w-[44px]');
      expect(goalModalFile).toContain('aria-label="Close dialog"');
    });

    it('enforces 44px control height (h-11) and rounded-xl radius', () => {
      expect(goalModalFile).toContain('h-11');
      expect(goalModalFile).toContain('rounded-xl');
    });

    it('enforces mobile text size >= 16px to prevent iOS/Android zoom (text-base sm:text-sm)', () => {
      expect(goalModalFile).toContain('text-base sm:text-sm');
    });

    it('enforces equal two-column grid for Direction/Unit and Start/Target', () => {
      const occurrences = (goalModalFile.match(/grid grid-cols-1 sm:grid-cols-2 gap-4/g) || []).length;
      expect(occurrences).toBeGreaterThanOrEqual(2);
    });

    it('enforces aligned footer buttons with minimum 44px height', () => {
      expect(goalModalFile).toContain('flex items-center justify-end gap-3 pt-4 border-t');
      expect(goalModalFile).toContain('min-h-[44px] px-5 rounded-xl');
      expect(goalModalFile).toContain('min-h-[44px] px-6 rounded-xl');
    });
  });

  describe('Replyf Brand & Logo Integration (Part J)', () => {
    it('uses the approved Replyf logo asset path /icons/icon-192x192.png in Auth screen', () => {
      expect(authGuestFile).toContain('/icons/icon-192x192.png');
      expect(authGuestFile).toContain('alt="Replyf logo"');
    });

    it('uses the approved Replyf logo asset in app root navbar', () => {
      expect(appPageFile).toContain('/icons/icon-192x192.png');
      expect(appPageFile).toContain('alt="Replyf logo"');
    });

    it('mobile header hides desktop navigation and shows hamburger menu button', () => {
      // Desktop nav is hidden on mobile
      expect(appPageFile).toContain('hidden md:flex');
      // Hamburger is hidden on desktop
      expect(appPageFile).toContain('md:hidden');
      // Menu button has accessible label
      expect(appPageFile).toContain('aria-label="Open navigation"');
      // Menu button has 44px min touch target
      expect(appPageFile).toContain('min-h-[44px] min-w-[44px]');
    });

    it('MobileNavDrawer component exists and uses Sheet primitive', () => {
      const mobileNavFile = fs.readFileSync(
        path.resolve(__dirname, '../components/layout/mobile-nav-drawer.tsx'),
        'utf-8'
      );
      expect(mobileNavFile).toContain('Sheet');
      expect(mobileNavFile).toContain('SheetContent');
      expect(mobileNavFile).toContain('aria-label="Close navigation"');
      expect(mobileNavFile).toContain('min-h-[44px]');
      // Contains nav routes
      expect(mobileNavFile).toContain('/programs');
      expect(mobileNavFile).toContain('/goals');
      expect(mobileNavFile).toContain('/challenges');
      expect(mobileNavFile).toContain('/exercises');
      expect(mobileNavFile).toContain('/dashboard');
      // Contains Guest/Account section
      expect(mobileNavFile).toContain('Guest Mode');
      expect(mobileNavFile).toContain('Switch Account');
    });

    it('does not contain any leftover "FinWise" branding in AuthGuestScreen or Page', () => {
      expect(authGuestFile).not.toContain('FinWise');
      expect(appPageFile).not.toContain('FinWise');
    });

    it('displays Replyf as application brand title with supporting text', () => {
      expect(authGuestFile).toContain('Replyf');
      expect(authGuestFile).toContain('Local-first fitness planning');
      expect(appPageFile).toContain('Replyf');
    });
  });
});
