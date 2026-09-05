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
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserCheck, LogIn, ArrowRight, Lock, Mail, X, Loader2, AlertCircle } from 'lucide-react';
import { useAuthGuard } from '@/contexts/auth-guard-context';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export function AuthGuestScreen() {
  const { selectGuestMode, authenticateUser } = useAuthGuard();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGuestClick = async () => {
    setLoading(true);
    try {
      await selectGuestMode();
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = getBrowserSupabaseClient();
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          // If offline or placeholder supabase url, allow simulated auth for local testing
          if (error.message.includes('FetchError') || error.message.includes('placeholder')) {
            await authenticateUser(email);
            setShowAuthModal(false);
            return;
          }
          throw error;
        }
        if (data.user) {
          await authenticateUser(email);
          setShowAuthModal(false);
        } else {
          setErrorMsg('Confirmation email sent. Check your inbox.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // If offline or placeholder supabase url, allow simulated auth for local testing
          if (error.message.includes('FetchError') || error.message.includes('placeholder')) {
            await authenticateUser(email);
            setShowAuthModal(false);
            return;
          }
          throw error;
        }
        if (data.user) {
          await authenticateUser(email);
          setShowAuthModal(false);
        }
      }
    } catch (err: any) {
      console.warn('[AuthGuestScreen] Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
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
            onClick={() => setShowAuthModal(true)}
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

      {/* Sign In / Sign Up Modal */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            style={{ width: 'min(calc(100vw - 32px), 480px)' }}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-slate-800 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="auth-modal-title" className="text-lg font-bold text-slate-900">
                    {authMode === 'signin' ? 'Sign In to Replyf' : 'Create an Account'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {authMode === 'signin' ? 'Access your cloud-synced routines' : 'Sync your workouts seamlessly across devices'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setErrorMsg(null);
                }}
                aria-label="Close dialog"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="auth-email-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="auth-password-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">
                  {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-800 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  {authMode === 'signin' ? 'Create one now' : 'Sign in instead'}
                </button>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setErrorMsg(null);
                  }}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
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
          </div>
        </div>
      )}
    </div>
  );
}
