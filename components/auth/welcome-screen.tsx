/**
 * Dedicated Post-Authentication Welcome Transition Screen
 * 
 * Production-grade welcome moment establishing emotional connection:
 * - Centered composition, generous whitespace, Replyf brand anchoring.
 * - Distinct messaging:
 *   - New Account: "Welcome, [Name]" / "Your training space is ready."
 *   - Returning User: "Welcome back, [Name]" / "Good to have you back."
 *   - Safe fallback if name missing: "Welcome to Replyf" / "Welcome back"
 * - USER-CONTROLLED: Never auto-navigates. Progression requires explicit "Continue" click.
 * - Restrained entrance animation (800–1100ms) honoring prefers-reduced-motion.
 * - Triggers single success toast ~350ms after mount.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AuthTransitionKind } from '@/contexts/auth-guard-context';

export interface WelcomeScreenProps {
  kind: AuthTransitionKind;
  displayName: string | null;
  onContinue: () => void;
}

export function WelcomeScreen({ kind, displayName, onContinue }: WelcomeScreenProps) {
  const { toast } = useToast();
  const toastFiredRef = useRef<boolean>(false);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  // Determine copy based on authentication flow kind and name availability
  const hasName = Boolean(displayName && displayName.trim().length > 0);
  const cleanName = hasName ? displayName!.trim() : null;

  const headingText = kind === 'signup'
    ? (cleanName ? `Welcome, ${cleanName}` : 'Welcome to Replyf')
    : (cleanName ? `Welcome back, ${cleanName}` : 'Welcome back');

  const subtitleText = kind === 'signup'
    ? 'Your training space is ready.'
    : 'Good to have you back.';

  // Fire functional toast confirmation ~350ms after mounting (exactly once)
  useEffect(() => {
    if (toastFiredRef.current) return;
    toastFiredRef.current = true;

    const timer = setTimeout(() => {
      const toastTitle = kind === 'signup'
        ? 'Account created successfully'
        : 'Signed in successfully';

      toast({
        title: toastTitle,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [kind, toast]);

  // Autofocus the Continue button after entrance animation completes for keyboard accessibility
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      continueButtonRef.current?.focus();
    }, 850);
    return () => clearTimeout(focusTimer);
  }, []);

  return (
    <main
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 px-4 sm:px-6 select-none overflow-hidden"
      role="region"
      aria-label="Welcome screen"
    >
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none">
        
        {/* Replyf Brand Logo */}
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-3xl shadow-xl shadow-indigo-200/60 border border-white/80 animate-in fade-in zoom-in-90 duration-700 motion-reduce:animate-none">
          <Image
            src="/icons/icon-192x192.png"
            alt="Replyf logo"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            priority
          />
        </div>

        {/* Text Focal Point */}
        <div className="space-y-3">
          <h1
            className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150 motion-reduce:animate-none break-words"
            tabIndex={-1}
          >
            {headingText}
          </h1>
          <p className="text-base sm:text-lg text-slate-500 font-medium max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 motion-reduce:animate-none">
            {subtitleText}
          </p>
        </div>

        {/* Explicit User Continue Action */}
        <div className="pt-4 w-full max-w-xs animate-in fade-in slide-in-from-bottom-3 duration-700 delay-500 motion-reduce:animate-none">
          <Button
            ref={continueButtonRef}
            type="button"
            onClick={onContinue}
            className="w-full min-h-[48px] px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </main>
  );
}
