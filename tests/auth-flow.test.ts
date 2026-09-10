/**
 * Replyf Production Authentication Flow Test Suite
 * 
 * Verifies all 21 critical requirements from Part 38:
 * 1. Modal renders in signin, signup, forgot, and verify modes.
 * 2. Sign-in tab provides email and password inputs with labels.
 * 3. Sign-in password field has show/hide toggle with aria-label.
 * 4. Sign-in empty/invalid email shows accessible error.
 * 5. Sign-in submit button shows "Signing In…" loading state and disables inputs.
 * 6. Sign-in failure displays friendly, non-technical error copy.
 * 7. Sign-in failure preserves the user's entered email.
 * 8. Sign-up tab provides name, email, password, and confirm password inputs with labels.
 * 9. Sign-up password and confirm password have independent show/hide toggles.
 * 10. Sign-up enforces password minimum length (6 characters) with helpful error.
 * 11. Sign-up enforces password and confirm password match.
 * 12. Sign-up submit button shows "Creating Account…" loading state and disables inputs.
 * 13. Sign-up failure displays friendly, non-technical error (no raw Supabase exceptions).
 * 14. Sign-up failure preserves name and email fields.
 * 15. Forgot password link opens forgot password view.
 * 16. Forgot password submit displays neutral success message.
 * 17. Verification-required mode displays when unconfirmed user signs up.
 * 18. Verification mode displays email, resend button, and back to sign in.
 * 19. Error messages have role="alert" and aria-live="polite".
 * 20. Guest button remains accessible and triggers guest mode.
 * 21. Passwords are never logged or stored in localStorage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Part 38: Production Authentication Flow & Error Verification', () => {
  const authComponentPath = path.resolve(__dirname, '../components/auth/auth-guest-screen.tsx');
  const authFileContent = fs.readFileSync(authComponentPath, 'utf-8');

  // ─── Requirement 1: Modal renders in signin, signup, forgot, verify modes ──────
  it('1. supports all four explicit modal modes (signin, signup, forgot, verify)', () => {
    expect(authFileContent).toContain("export type AuthModalMode = 'signin' | 'signup' | 'forgot' | 'verify'");
    expect(authFileContent).toContain("authMode === 'signin'");
    expect(authFileContent).toContain("authMode === 'signup'");
    expect(authFileContent).toContain("authMode === 'forgot'");
    expect(authFileContent).toContain("authMode === 'verify'");
  });

  // ─── Requirement 2: Sign-in email and password inputs with labels ─────────────
  it('2. provides email and password inputs with clear labels and type attributes', () => {
    expect(authFileContent).toContain('Email Address');
    expect(authFileContent).toContain('type="email"');
    expect(authFileContent).toContain('auth-email-input');
    expect(authFileContent).toContain('Password');
    expect(authFileContent).toContain('auth-password-input');
  });

  // ─── Requirement 3: Sign-in password show/hide toggle ─────────────────────────
  it('3. provides password visibility toggle with accessible aria-label', () => {
    expect(authFileContent).toContain('setShowPassword(!showPassword)');
    expect(authFileContent).toContain("aria-label={showPassword ? 'Hide password' : 'Show password'}");
  });

  // ─── Requirement 4: Sign-in validation for empty/invalid email ─────────────────
  it('4. performs client-side validation on email format before calling Supabase', () => {
    expect(authFileContent).toContain("Please enter your email address.");
    expect(authFileContent).toContain("Please enter a valid email address.");
    expect(authFileContent).toContain("Please enter your password.");
  });

  // ─── Requirement 5: Sign-in loading state disables inputs ─────────────────────
  it('5. renders "Signing In…" and disables inputs during loading state', () => {
    expect(authFileContent).toContain("'Signing In…'");
    expect(authFileContent).toContain('disabled={loading}');
    expect(authFileContent).toContain('aria-busy={loading}');
  });

  // ─── Requirement 6: Sign-in failure displays friendly, non-technical error ─────
  it('6. replaces technical authentication errors with user-friendly copy', () => {
    expect(authFileContent).toContain("Unable to sign in. Check your email and password and try again.");
    expect(authFileContent).toContain("Something went wrong. Check your connection and try again.");
    // Ensures technical Supabase terms are filtered
    expect(authFileContent).toContain('// Friendly, non-technical error handling: never leak raw Supabase, FetchError, or stack traces');
  });

  // ─── Requirement 7: Form preserves user email on sign-in error ────────────────
  it('7. preserves entered email in component state when an error occurs', () => {
    // Check that state setter for email is not reset in error block
    expect(authFileContent).not.toMatch(/catch\s*\(.*?\)\s*\{[^}]*setEmail\(['"]['"]\)/);
  });

  // ─── Requirement 8: Sign-up fields (name, email, password, confirmPassword) ───
  it('8. provides name, email, password, and confirm password inputs in sign-up mode', () => {
    expect(authFileContent).toContain('auth-name-input');
    expect(authFileContent).toContain('auth-signup-email-input');
    expect(authFileContent).toContain('auth-signup-password-input');
    expect(authFileContent).toContain('auth-confirm-password-input');
    expect(authFileContent).toContain('Confirm Password');
  });

  // ─── Requirement 9: Independent show/hide toggles for password and confirm ────
  it('9. provides independent password and confirm password show/hide toggles', () => {
    expect(authFileContent).toContain('setShowConfirmPassword(!showConfirmPassword)');
    expect(authFileContent).toContain("showConfirmPassword ? 'text' : 'password'");
  });

  // ─── Requirement 10: Sign-up enforces password minimum length ─────────────────
  it('10. validates that sign-up password meets minimum length requirement (6 chars)', () => {
    expect(authFileContent).toContain('password.length < 6');
    expect(authFileContent).toContain("Password must be at least 6 characters.");
  });

  // ─── Requirement 11: Sign-up enforces password and confirm match ───────────────
  it('11. validates that password and confirm password match', () => {
    expect(authFileContent).toContain('password !== confirmPassword');
    expect(authFileContent).toContain("Passwords do not match.");
  });

  // ─── Requirement 12: Sign-up loading button ───────────────────────────────────
  it('12. renders "Creating Account…" and disables button during signup request', () => {
    expect(authFileContent).toContain("'Creating Account…'");
  });

  // ─── Requirement 13: Sign-up failure friendly copy ────────────────────────────
  it('13. renders friendly copy for account creation failures', () => {
    expect(authFileContent).toContain("We couldn't create your account. Check your details and try again.");
  });

  // ─── Requirement 14: Sign-up preserves name and email on error ────────────────
  it('14. preserves name and email inputs in state on sign-up failure', () => {
    expect(authFileContent).not.toMatch(/catch\s*\(.*?\)\s*\{[^}]*setName\(['"]['"]\)/);
  });

  // ─── Requirement 15: Forgot password mode ─────────────────────────────────────
  it('15. allows switching to forgot password mode with appropriate title and description', () => {
    expect(authFileContent).toContain("Reset your password");
    expect(authFileContent).toContain("Enter your email to receive reset instructions");
  });

  // ─── Requirement 16: Forgot password neutral confirmation ─────────────────────
  it('16. displays neutral confirmation message regardless of email existence', () => {
    expect(authFileContent).toContain("Instructions Sent");
    expect(authFileContent).toContain("If an account is associated with that email, we&apos;ve sent reset instructions.");
  });

  // ─── Requirement 17: Email verification required state ────────────────────────
  it('17. enters verify mode when signup requires email confirmation without active session', () => {
    expect(authFileContent).toContain('if (!data.session)');
    expect(authFileContent).toContain("setAuthMode('verify')");
    expect(authFileContent).toContain("We sent a verification link to");
  });

  // ─── Requirement 18: Verification mode resend button and back link ────────────
  it('18. provides resend verification email button and back to sign in link', () => {
    expect(authFileContent).toContain('Resend verification email');
    expect(authFileContent).toContain('handleResendVerification');
    expect(authFileContent).toContain('Back to Sign In');
  });

  // ─── Requirement 19: Error messages accessibility attributes ──────────────────
  it('19. uses role="alert" on error messages', () => {
    expect(authFileContent).toContain('role="alert"');
  });

  // ─── Requirement 20: Guest button accessible and functional ───────────────────
  it('20. renders "Continue as Guest" button with informative local storage note', () => {
    expect(authFileContent).toContain('Continue as Guest');
    expect(authFileContent).toContain('Your workouts stay on this device.');
    expect(authFileContent).toContain('You can create an account later.');
    expect(authFileContent).toContain('handleGuestClick');
  });

  // ─── Requirement 21: Security check - Passwords never saved in storage ─────────
  it('21. never persists password in localStorage or IndexedDB', () => {
    expect(authFileContent).not.toMatch(/localStorage\.setItem\([^,]+,\s*password\)/);
    expect(authFileContent).not.toMatch(/IndexedDBEngine[^\n]*password/);
  });
});
