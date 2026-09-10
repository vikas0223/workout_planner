/**
 * Auth / Guest Entry Screen Component (Part D, E, J)
 * 
 * Hierarchy:
 * [ Replyf logo ]
 * Replyf
 * Local-first fitness planning
 * [ Sign in / Create account ]
 * ──────── or ────────
 * [ Continue as Guest ]
 * Your workouts stay on this device.
 * You can create an account later.
 * 
 * Production-grade multi-mode authentication modal:
 * - Sign In: Email + Password (show/hide toggle) + Forgot password
 * - Sign Up: Name + Email + Password + Confirm Password (show/hide toggles)
 * - Forgot Password: Email + Neutral confirmation
 * - Email Verification: Non-authenticated verification gate when email confirmation is active
 * - Strict validation, friendly non-technical error copy, duplicate-submission guards
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserCheck,
  LogIn,
  ArrowRight,
  Lock,
  Mail,
  User,
  X,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useAuthGuard } from '@/contexts/auth-guard-context';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export type AuthModalMode = 'signin' | 'signup' | 'forgot' | 'verify';

export function AuthGuestScreen() {
  const { selectGuestMode, authenticateUser } = useAuthGuard();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>('signin');

  // Form Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Status & Error States
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotSubmitted, setForgotSubmitted] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const resetFormState = () => {
    setErrorMsg(null);
    setForgotSubmitted(false);
    setResendStatus(null);
  };

  const handleOpenModal = (mode: AuthModalMode = 'signin') => {
    setAuthMode(mode);
    resetFormState();
    setShowAuthModal(true);
  };

  const handleCloseModal = () => {
    if (loading) return;
    setShowAuthModal(false);
    resetFormState();
  };

  const handleGuestClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await selectGuestMode();
    } finally {
      setLoading(false);
    }
  };

  // Sign In / Sign Up submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    // Client-side validation: Email
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Client-side validation: Password
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (authMode === 'signup') {
      if (!cleanName) {
        setErrorMsg('Please enter your name.');
        return;
      }
      if (cleanName.length > 100) {
        setErrorMsg('Name must be 100 characters or less.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = getBrowserSupabaseClient();

      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: cleanName,
              full_name: cleanName,
            },
          },
        });

        if (error) {
          throw error;
        }

        // Check if email confirmation is required by inspecting session
        if (!data.session) {
          // Verification required: do NOT authenticate or show Welcome screen yet!
          setAuthMode('verify');
          return;
        }

        // Account authenticated immediately
        if (data.user) {
          const resolvedName = cleanName || data.user.user_metadata?.display_name || null;
          await authenticateUser(cleanEmail, resolvedName || undefined, 'signup', data.user.id);
          setShowAuthModal(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          const meta = data.user.user_metadata;
          const resolvedName = meta?.display_name || meta?.full_name || meta?.name || null;
          await authenticateUser(cleanEmail, resolvedName || undefined, 'signin', data.user.id);
          setShowAuthModal(false);
        }
      }
    } catch (err: any) {
      // Friendly, non-technical error handling: never leak raw Supabase, FetchError, or stack traces
      const rawMsg = (err?.message || '').toLowerCase();
      const isNetwork =
        rawMsg.includes('fetch') ||
        rawMsg.includes('network') ||
        rawMsg.includes('failed to fetch') ||
        rawMsg.includes('connection');

      if (isNetwork) {
        setErrorMsg('Something went wrong. Check your connection and try again.');
      } else if (authMode === 'signup') {
        setErrorMsg("We couldn't create your account. Check your details and try again.");
      } else {
        setErrorMsg('Unable to sign in. Check your email and password and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot password submission
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = getBrowserSupabaseClient();
      await supabase.auth.resetPasswordForEmail(cleanEmail).catch(() => {});
      // Always show neutral confirmation to prevent account enumeration
      setForgotSubmitted(true);
    } catch {
      setForgotSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (loading) return;
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setLoading(true);
    setResendStatus(null);

    try {
      const supabase = getBrowserSupabaseClient();
      await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      setResendStatus('Verification email resent. Please check your inbox.');
    } catch {
      setResendStatus('Verification email resent. Please check your inbox.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-10 sm:py-16 px-4">
      <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Logo & Hierarchy */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4 h-14 w-14 overflow-hidden rounded-2xl shadow-md shadow-indigo-200">
            <Image
              src="/icons/icon-192x192.png"
              alt="Replyf logo"
              width={56}
              height={56}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Replyf
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1 mb-8">
            Local-first fitness planning
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Primary Action: Sign in / Create account */}
          <button
            type="button"
            id="auth-sign-in-btn"
            onClick={() => handleOpenModal('signin')}
            disabled={loading}
            className="w-full min-h-[48px] px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-60"
            aria-label="Sign in or Create account"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in / Create account</span>
          </button>

          {/* Accessible Separator */}
          <div className="relative flex items-center justify-center py-2" role="separator" aria-label="or">
            <div className="w-full border-t border-slate-200"></div>
            <span className="absolute bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              or
            </span>
          </div>

          {/* First-class Option: Continue as Guest */}
          <button
            type="button"
            id="auth-continue-guest-btn"
            onClick={handleGuestClick}
            disabled={loading}
            className="w-full min-h-[48px] px-6 py-3 rounded-2xl border-2 border-slate-200 hover:border-slate-300 active:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-60"
            aria-label="Continue as Guest"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <UserCheck className="w-4 h-4 text-indigo-600" />
            )}
            <span>Continue as Guest</span>
          </button>
        </div>

        {/* Supporting Text */}
        <p className="mt-6 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
          Your workouts stay on this device.
          <br />
          You can create an account later.
        </p>

        {/* Link to Marketing Landing Page */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            href="/landing"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-md p-1"
          >
            <span>Explore features & how Replyf works</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Production Multi-Mode Auth Modal */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            style={{ width: 'min(calc(100vw - 32px), 480px)' }}
            className="max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-slate-800 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  {authMode === 'signup' ? (
                    <User className="w-4 h-4" />
                  ) : authMode === 'forgot' ? (
                    <KeyRound className="w-4 h-4" />
                  ) : authMode === 'verify' ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h2 id="auth-modal-title" className="text-lg font-bold text-slate-900">
                    {authMode === 'signup'
                      ? 'Create your Replyf account'
                      : authMode === 'forgot'
                      ? 'Reset your password'
                      : authMode === 'verify'
                      ? 'Check your email'
                      : 'Sign In to Replyf'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {authMode === 'signup'
                      ? 'Save your routines and sync them across devices'
                      : authMode === 'forgot'
                      ? 'Enter your email to receive reset instructions'
                      : authMode === 'verify'
                      ? 'Verify your account to sign in'
                      : 'Access your cloud-synced routines'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                aria-label="Close dialog"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. SIGN IN / SIGN UP FORMS */}
            {(authMode === 'signin' || authMode === 'signup') && (
              <form onSubmit={handleAuthSubmit} className="space-y-4" aria-busy={loading}>
                {/* Name field (Sign Up only) */}
                {authMode === 'signup' && (
                  <div className="flex flex-col gap-1.5 text-left animate-in fade-in duration-200">
                    <label
                      htmlFor="auth-name-input"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                    >
                      Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-name-input"
                        type="text"
                        required
                        disabled={loading}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Vikas"
                        maxLength={100}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all disabled:bg-slate-50 disabled:opacity-75"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address field */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label
                    htmlFor={authMode === 'signup' ? 'auth-signup-email-input' : 'auth-email-input'}
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={authMode === 'signup' ? 'auth-signup-email-input' : 'auth-email-input'}
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all disabled:bg-slate-50 disabled:opacity-75"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="flex flex-col gap-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={authMode === 'signup' ? 'auth-signup-password-input' : 'auth-password-input'}
                      className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                    >
                      Password
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          resetFormState();
                        }}
                        disabled={loading}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={authMode === 'signup' ? 'auth-signup-password-input' : 'auth-password-input'}
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all disabled:bg-slate-50 disabled:opacity-75"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="min-h-[44px] min-w-[44px] absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-r-xl"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password field (Sign Up only) */}
                {authMode === 'signup' && (
                  <div className="flex flex-col gap-1.5 text-left animate-in fade-in duration-200">
                    <label
                      htmlFor="auth-confirm-password-input"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        disabled={loading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all disabled:bg-slate-50 disabled:opacity-75"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        className="min-h-[44px] min-w-[44px] absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-r-xl"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode Switcher */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                  </span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                      resetFormState();
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50"
                  >
                    {authMode === 'signin' ? 'Create one now' : 'Sign in'}
                  </button>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={loading}
                    className="min-h-[44px] px-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-[44px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{authMode === 'signin' ? 'Signing In…' : 'Creating Account…'}</span>
                      </>
                    ) : (
                      <>
                        <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 2. FORGOT PASSWORD MODE */}
            {authMode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4" aria-busy={loading}>
                {forgotSubmitted ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 text-left animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instructions Sent</span>
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      If an account is associated with that email, we&apos;ve sent reset instructions.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 text-left">
                    <label
                      htmlFor="auth-forgot-email-input"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-forgot-email-input"
                        type="email"
                        required
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all disabled:bg-slate-50 disabled:opacity-75"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setAuthMode('signin');
                      resetFormState();
                    }}
                    className="min-h-[44px] px-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50"
                  >
                    Back to Sign In
                  </button>

                  {!forgotSubmitted && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="min-h-[44px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* 3. EMAIL VERIFICATION REQUIRED MODE */}
            {authMode === 'verify' && (
              <div className="space-y-4 text-left animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-slate-800 space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    We sent a verification link to <strong className="text-slate-900">{email}</strong>.
                    Please verify your account, then sign in.
                  </p>
                </div>

                {resendStatus && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resendStatus}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setAuthMode('signin');
                      resetFormState();
                    }}
                    className="min-h-[44px] px-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResendVerification}
                    className="min-h-[44px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending…</span>
                      </>
                    ) : (
                      <span>Resend verification email</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
