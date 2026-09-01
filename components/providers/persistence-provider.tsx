'use client';

/**
 * Persistence Provider
 * Bootstraps IndexedDB and triggers background migration on initial client render.
 */

import React from 'react';
import { useLocalPersistence } from '@/hooks/use-local-persistence';

export function PersistenceProvider({ children }: { children: React.ReactNode }) {
  useLocalPersistence();
  return <>{children}</>;
}
