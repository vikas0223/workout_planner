/**
 * Non-Blocking Rest Timer Component
 * 
 * Accessible, responsive timer for between-set intervals.
 * Provides Start, Pause, Resume, Skip, +15s, and -15s controls.
 * Operates purely locally and non-blockingly without hindering set logging.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Plus, Minus, Bell, Timer } from 'lucide-react';

export interface RestTimerProps {
  initialSeconds?: number;
  autoStart?: boolean;
  onTimerComplete?: () => void;
}

export function RestTimer({
  initialSeconds = 90,
  autoStart = false,
  onTimerComplete,
}: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState<number>(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(autoStart);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial seconds when changed externally
  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setSecondsRemaining(initialSeconds);
    if (autoStart) {
      setIsActive(true);
    }
  }, [initialSeconds, autoStart]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    if (onTimerComplete) {
      onTimerComplete();
    }
  }, [onTimerComplete]);

  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, secondsRemaining, handleComplete]);

  const togglePlay = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(totalSeconds);
    }
    setIsActive((prev) => !prev);
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(totalSeconds);
  };

  const adjustTime = (delta: number) => {
    setSecondsRemaining((prev) => Math.max(0, prev + delta));
    setTotalSeconds((prev) => Math.max(15, prev + delta));
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return (
    <div className="p-3.5 sm:p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3">
      {/* Left: Timer Display */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-800 text-indigo-400">
          <Timer className="w-5 h-5" />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
          )}
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Rest Interval
          </span>
          <span className="text-lg font-black tracking-tight font-mono text-indigo-300">
            {formatTime(secondsRemaining)}
          </span>
        </div>
      </div>

      {/* Center / Right: Controls */}
      <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => adjustTime(-15)}
          className="h-8 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Subtract 15 seconds"
        >
          <Minus className="w-3.5 h-3.5" />
          15s
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => adjustTime(15)}
          className="h-8 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Add 15 seconds"
        >
          <Plus className="w-3.5 h-3.5" />
          15s
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={togglePlay}
          className={`h-8 px-3 text-xs font-bold rounded-xl shadow-xs transition-all ${
            isActive
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
          aria-label={isActive ? 'Pause timer' : 'Start timer'}
        >
          {isActive ? (
            <>
              <Pause className="w-3.5 h-3.5 mr-1 fill-current" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 mr-1 fill-current" />
              Start
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
