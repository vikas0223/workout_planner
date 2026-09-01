/**
 * React Hook for Storage Estimation
 * 
 * Queries navigator.storage.estimate() for approximate usage/quota.
 * Provides graceful fallback when API is unavailable.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface StorageEstimate {
  /** Approximate bytes used */
  usage: number;
  /** Approximate total quota in bytes */
  quota: number;
  /** Usage percentage (0-100) */
  percent: number;
  /** Whether the Storage API is available */
  isEstimateAvailable: boolean;
  /** Whether storage is loading */
  isLoading: boolean;
  /** Refresh the estimate */
  refresh: () => Promise<void>;
}

const DEFAULT_ESTIMATE: Omit<StorageEstimate, 'refresh'> = {
  usage: 0,
  quota: 0,
  percent: 0,
  isEstimateAvailable: false,
  isLoading: true,
};

export function useStorageEstimate(): StorageEstimate {
  const [estimate, setEstimate] = useState<Omit<StorageEstimate, 'refresh'>>(DEFAULT_ESTIMATE);

  const refresh = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      setEstimate({ ...DEFAULT_ESTIMATE, isLoading: false, isEstimateAvailable: false });
      return;
    }

    try {
      const est = await navigator.storage.estimate();
      const usage = est.usage ?? 0;
      const quota = est.quota ?? 0;
      const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;

      setEstimate({
        usage,
        quota,
        percent,
        isEstimateAvailable: true,
        isLoading: false,
      });
    } catch {
      setEstimate({ ...DEFAULT_ESTIMATE, isLoading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...estimate, refresh };
}

/**
 * Formats bytes into a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
