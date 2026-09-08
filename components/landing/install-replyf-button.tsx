/**
 * Install Replyf Button Component
 * 
 * Centralized CTA trigger for PWA installation across all Replyf entrypoints
 * (Floating Navbar, Mobile Drawer, Hero Section, Offline Section, and Final CTA).
 * 
 * Behavior:
 * 1. If already installed: disables or hides CTA, preventing redundant prompts.
 * 2. If native prompt is available: directly invokes native browser prompt.
 * 3. If native prompt is unavailable: opens platform-specific fallback guidance modal.
 */

'use client';

import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '@/lib/landing/install-prompt';
import { InstallReplyfModal } from './install-replyf-modal';

export interface InstallReplyfButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  label?: string;
  hideWhenInstalled?: boolean;
}

export function InstallReplyfButton({
  className = '',
  variant = 'secondary',
  size = 'md',
  showIcon = true,
  label = 'Install Replyf',
  hideWhenInstalled = false,
}: InstallReplyfButtonProps) {
  const { isInstalled, platform, triggerInstall } = useInstallPrompt();
  const [modalOpen, setModalOpen] = useState(false);

  if (hideWhenInstalled && isInstalled) {
    return null;
  }

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm border-transparent',
    secondary:
      'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border-slate-200/90 shadow-xs hover:border-slate-300',
    outline:
      'bg-transparent hover:bg-slate-100/80 active:bg-slate-200/60 text-slate-700 border-slate-300',
    ghost:
      'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 border-transparent',
  };

  const sizeStyles = {
    sm: 'min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-xl',
    md: 'min-h-[44px] px-4 py-2.5 text-sm font-bold rounded-xl',
    lg: 'min-h-[48px] px-6 py-3 text-base font-bold rounded-2xl',
  };

  const handleClick = async () => {
    if (isInstalled) return;
    const outcome = await triggerInstall();
    if (outcome === 'manual_needed') {
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isInstalled}
        className={`inline-flex items-center justify-center gap-2 border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-default disabled:active:scale-100 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        aria-label={isInstalled ? 'Replyf is installed on this device' : label}
        title={isInstalled ? 'Replyf is already installed' : label}
      >
        {showIcon && (
          isInstalled ? (
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
          )
        )}
        <span>{isInstalled ? 'Installed' : label}</span>
      </button>

      <InstallReplyfModal
        open={modalOpen && !isInstalled}
        onOpenChange={setModalOpen}
        platform={platform}
      />
    </>
  );
}
