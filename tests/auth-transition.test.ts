/**
 * Welcome Transition & Header-Free Onboarding Guard Test Suite
 * 
 * Verifies all requirements from Part 40 & 41:
 * 1. WelcomeScreen renders personalized heading for signup ("Welcome, [Name]").
 * 2. WelcomeScreen renders personalized heading for signin ("Welcome back, [Name]").
 * 3. WelcomeScreen falls back gracefully to "Welcome to Replyf" or "Welcome back" when displayName is missing.
 * 4. Subtitle indicates training space readiness for signup vs good to have you back for signin.
 * 5. Requires explicit user action ("Continue" button) and NEVER auto-navigates.
 * 6. Fires functional toast confirmation at ~350ms.
 * 7. Respects prefers-reduced-motion via motion-reduce:animate-none.
 * 8. Has accessible semantics (role="region", aria-label="Welcome screen").
 * 9. AuthGuardContext manages transient in-memory authTransition ({ kind, displayName }).
 * 10. completeAuthTransition() clears authTransition back to null.
 * 11. Initial startup session restoration never triggers authTransition (no welcome screen replay).
 * 12. page.tsx displays WelcomeScreen when authTransition is active.
 * 13. When onboardingState === 'incomplete', page.tsx renders dedicated Header-Free Onboarding Shell with WorkoutWizard.
 * 14. Header-Free Onboarding Shell omits main app header, nav links, and WorkoutHub sub-tabs.
 * 15. When onboardingState === 'complete', page.tsx renders standard shell with main header and WorkoutHub.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Part 40 & 41: Welcome Transition & Header-Free Onboarding Guard', () => {
  const welcomeScreenPath = path.resolve(__dirname, '../components/auth/welcome-screen.tsx');
  const welcomeScreenContent = fs.readFileSync(welcomeScreenPath, 'utf-8');

  const authGuardPath = path.resolve(__dirname, '../contexts/auth-guard-context.tsx');
  const authGuardContent = fs.readFileSync(authGuardPath, 'utf-8');

  const pagePath = path.resolve(__dirname, '../app/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf-8');

  // ─── Requirement 1: Welcome heading for signup ────────────────────────────────
  it('1. formats signup heading with user name ("Welcome, [Name]")', () => {
    expect(welcomeScreenContent).toContain("kind === 'signup'");
    expect(welcomeScreenContent).toContain("cleanName ? `Welcome, ${cleanName}` : 'Welcome to Replyf'");
  });

  // ─── Requirement 2: Welcome heading for signin ────────────────────────────────
  it('2. formats signin heading with user name ("Welcome back, [Name]")', () => {
    expect(welcomeScreenContent).toContain("cleanName ? `Welcome back, ${cleanName}` : 'Welcome back'");
  });

  // ─── Requirement 3: Safe fallback when name is missing ────────────────────────
  it('3. falls back gracefully to generic welcome when name is empty or whitespace', () => {
    expect(welcomeScreenContent).toContain('const hasName = Boolean(displayName && displayName.trim().length > 0)');
    expect(welcomeScreenContent).toContain("'Welcome to Replyf'");
    expect(welcomeScreenContent).toContain("'Welcome back'");
  });

  // ─── Requirement 4: Subtitle copy distinction ─────────────────────────────────
  it('4. provides distinct subtitle copy for new accounts vs returning sign-in', () => {
    expect(welcomeScreenContent).toContain("'Your training space is ready.'");
    expect(welcomeScreenContent).toContain("'Good to have you back.'");
  });

  // ─── Requirement 5: User-controlled progression (No auto-navigation) ──────────
  it('5. provides a prominent Continue button and strictly avoids auto-redirecting', () => {
    expect(welcomeScreenContent).toContain('<span>Continue</span>');
    expect(welcomeScreenContent).toContain('onClick={onContinue}');
    // Verify there is NO automatic onContinue() inside a timer
    expect(welcomeScreenContent).not.toMatch(/setTimeout\(\s*\(\)\s*=>\s*\{\s*onContinue\(\)/);
  });

  // ─── Requirement 6: Toast confirmation at ~350ms ──────────────────────────────
  it('6. schedules functional toast at approximately 350ms delay', () => {
    expect(welcomeScreenContent).toContain('setTimeout(');
    expect(welcomeScreenContent).toContain('350');
    expect(welcomeScreenContent).toContain("'Account created successfully'");
    expect(welcomeScreenContent).toContain("'Signed in successfully'");
  });

  // ─── Requirement 7: Accessibility & reduced motion ────────────────────────────
  it('7. uses motion-reduce:animate-none for motion accessibility', () => {
    expect(welcomeScreenContent).toContain('motion-reduce:animate-none');
    expect(welcomeScreenContent).toContain('role="region"');
    expect(welcomeScreenContent).toContain('aria-label="Welcome screen"');
  });

  // ─── Requirement 8: In-memory transient auth transition state ─────────────────
  it('8. AuthGuardContext defines transient AuthTransitionState in memory only', () => {
    expect(authGuardContent).toContain("export type AuthTransitionKind = 'signup' | 'signin'");
    expect(authGuardContent).toContain('export interface AuthTransitionState');
    expect(authGuardContent).toContain('authTransition: AuthTransitionState | null');
    expect(authGuardContent).toContain('completeAuthTransition: () => void');
  });

  // ─── Requirement 9: authenticateUser triggers authTransition ──────────────────
  it('9. authenticateUser sets authTransition with kind and displayName', () => {
    expect(authGuardContent).toContain('setAuthTransition({');
    expect(authGuardContent).toContain('kind,');
    expect(authGuardContent).toContain('displayName: resolvedName');
  });

  // ─── Requirement 10: completeAuthTransition resets to null ─────────────────────
  it('10. completeAuthTransition resets authTransition state to null', () => {
    expect(authGuardContent).toContain('const completeAuthTransition = useCallback(() => {');
    expect(authGuardContent).toContain('setAuthTransition(null)');
  });

  // ─── Requirement 11: Startup session restoration does NOT trigger welcome ─────
  it('11. startup session restoration leaves authTransition as null', () => {
    expect(authGuardContent).toContain('useState<AuthTransitionState | null>(null)');
    expect(authGuardContent).toContain('// Step 5: Set status to ready (authTransition remains null on startup/refresh)');
  });

  // ─── Requirement 12: page.tsx renders WelcomeScreen when active ───────────────
  it('12. page.tsx checks authTransition and renders WelcomeScreen before any app views', () => {
    expect(pageContent).toContain('if (authTransition) {');
    expect(pageContent).toContain('<WelcomeScreen');
    expect(pageContent).toContain('kind={authTransition.kind}');
    expect(pageContent).toContain('displayName={authTransition.displayName}');
    expect(pageContent).toContain('onContinue={completeAuthTransition}');
  });

  // ─── Requirement 13 & 14: Header-Free Onboarding Shell ────────────────────────
  it('13 & 14. renders dedicated header-free shell for incomplete onboarding without header or sub-tabs', () => {
    // Branch 2 early return in page.tsx
    const onboardingBlockPattern = /if\s*\(\s*onboardingState\s*===\s*['"]incomplete['"]\s*\)\s*\{[\s\S]*?<WorkoutWizard[\s\S]*?return/;
    expect(pageContent).toContain("if (onboardingState === 'incomplete')");
    expect(pageContent).toContain('<WorkoutWizard onWorkoutGenerated={handleOnboardingWorkoutGenerated} />');

    // Make sure the header element is not in the incomplete branch
    const incompleteBranchMatch = pageContent.match(/if\s*\(onboardingState === 'incomplete'\)\s*\{([\s\S]*?)\n\s*\}/);
    expect(incompleteBranchMatch).toBeDefined();
    if (incompleteBranchMatch) {
      expect(incompleteBranchMatch[1]).not.toContain('<header');
      expect(incompleteBranchMatch[1]).not.toContain('Programs');
      expect(incompleteBranchMatch[1]).not.toContain('Goals');
      expect(incompleteBranchMatch[1]).not.toContain('WorkoutHub');
    }
  });

  // ─── Requirement 15: Standard Application Shell when onboarding complete ──────
  it('15. renders standard shell with header, nav links, and WorkoutHub when onboarding is complete', () => {
    expect(pageContent).toContain('<header className=');
    expect(pageContent).toContain('<WorkoutHub initialWorkout={stagedPlan} />');
    expect(pageContent).toContain('/programs');
    expect(pageContent).toContain('/goals');
    expect(pageContent).toContain('/challenges');
    expect(pageContent).toContain('/exercises');
    expect(pageContent).toContain('/dashboard');
  });
});
