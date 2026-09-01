'use client';

/**
 * Local Persistence Initialization Hook
 * Automatically runs schema check & idempotent localStorage migration on application load.
 */

import { useEffect, useState } from 'react';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { LocalStorageMigrationAdapter, MigrationReport } from '@/lib/storage/migration-adapter';

export interface LocalPersistenceState {
  isReady: boolean;
  error: Error | null;
  migrationReport: MigrationReport | null;
}

export function useLocalPersistence(): LocalPersistenceState {
  const [state, setState] = useState<LocalPersistenceState>({
    isReady: false,
    error: null,
    migrationReport: null,
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const engine = IndexedDBEngine.getInstance();
        await engine.getDB();

        const adapter = new LocalStorageMigrationAdapter(engine);
        const report = await adapter.runMigration();

        if (mounted) {
          setState({
            isReady: true,
            error: null,
            migrationReport: report,
          });
        }
      } catch (err: any) {
        console.error('[useLocalPersistence] Failed to initialize local persistence:', err);
        if (mounted) {
          setState({
            isReady: false,
            error: err instanceof Error ? err : new Error(String(err)),
            migrationReport: null,
          });
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
