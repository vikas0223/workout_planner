/**
 * Startup & Consistency Recovery Scanner
 * Protects against the crash scenario: local entity write succeeds but queue write fails.
 * Scans local stores for dirty records missing in sync_queue and reconstructs outbox items.
 */

import { getIndexedDBEngine, IndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES, StoreName, LocalRecordMeta } from '../storage/indexeddb-schema';
import { SyncOutbox } from './sync-outbox';
import { SyncQueueItem } from './sync-types';

export class SyncRecoveryScanner {
  private db: IndexedDBEngine;
  private outbox: SyncOutbox;

  constructor(db?: IndexedDBEngine, outbox?: SyncOutbox) {
    this.db = db || getIndexedDBEngine();
    this.outbox = outbox || new SyncOutbox(this.db);
  }

  /**
   * Scans all mutable user stores and recreates missing sync queue items.
   * Returns the count of recovered items.
   */
  public async scanAndRecover(): Promise<number> {
    const existingQueue = await this.db.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    const existingEntityIds = new Set(
      existingQueue
        .filter((item) => item.status === 'pending' || item.status === 'processing')
        .map((item) => `${item.entityType}:${item.entityId}`)
    );

    let recoveredCount = 0;

    const storesToScan: Array<{ storeName: StoreName; entityType: string }> = [
      { storeName: STORES.LOCAL_PROFILES, entityType: 'profiles' },
      { storeName: STORES.WORKOUT_TEMPLATES, entityType: 'workout_templates' },
      { storeName: STORES.GENERATED_WORKOUTS, entityType: 'generated_workouts' },
      { storeName: STORES.WORKOUT_SESSIONS, entityType: 'workout_sessions' },
      { storeName: STORES.SESSION_EXERCISES, entityType: 'session_exercises' },
      { storeName: STORES.SETS, entityType: 'logged_sets' },
      { storeName: STORES.FAVORITES, entityType: 'favorites' },
    ];

    for (const { storeName, entityType } of storesToScan) {
      const records = await this.db.getAll<LocalRecordMeta & Record<string, unknown>>(storeName);

      for (const record of records) {
        // Only recover authenticated user records that are unsynced
        if (
          record.ownerKind === 'user' &&
          record.syncStatus &&
          record.syncStatus !== 'synced'
        ) {
          const key = `${entityType}:${record.id}`;
          if (!existingEntityIds.has(key)) {
            // Missing in outbox queue -> recover and enqueue
            await this.outbox.enqueue({
              ownerKind: 'user',
              ownerId: record.ownerId,
              entityType,
              entityId: record.id,
              operation: record.deletedAt ? 'delete' : 'upsert',
              version: record.version || 1,
              payload: record as Record<string, unknown>,
              baseUpdatedAt: record.updatedAt || record.createdAt,
            });

            existingEntityIds.add(key);
            recoveredCount++;
          }
        }
      }
    }

    return recoveredCount;
  }
}
