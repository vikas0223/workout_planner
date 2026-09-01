/**
 * Master Sync Coordinator
 * Orchestrates push, pull, recovery scanning, lifecycle triggers, and status state.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getIndexedDBEngine, IndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES } from '../storage/indexeddb-schema';
import { SyncPushWorker, PushResult } from './sync-push';
import { SyncPullWorker } from './sync-pull';
import { SyncRecoveryScanner } from './sync-recovery';
import { SyncLock } from './sync-lock';
import { SyncOutbox } from './sync-outbox';
import { SyncStatusState, SyncQueueItem, SyncConflictItem } from './sync-types';
import { SyncEventEmitter } from './sync-events';
import { getBrowserSupabaseClient } from '../supabase/browser-client';

export class SyncCoordinator {
  private db: IndexedDBEngine;
  private pushWorker: SyncPushWorker;
  private pullWorker: SyncPullWorker;
  private recoveryScanner: SyncRecoveryScanner;
  private outbox: SyncOutbox;
  private isSyncing = false;
  private intervalId: any = null;

  constructor(
    db?: IndexedDBEngine,
    pushWorker?: SyncPushWorker,
    pullWorker?: SyncPullWorker,
    recoveryScanner?: SyncRecoveryScanner
  ) {
    this.db = db || getIndexedDBEngine();
    const lock = new SyncLock(this.db);
    this.outbox = new SyncOutbox(this.db);
    const client = getBrowserSupabaseClient();

    this.pushWorker = pushWorker || new SyncPushWorker(this.db, lock, this.outbox, client);
    this.pullWorker = pullWorker || new SyncPullWorker(this.db, client);
    this.recoveryScanner = recoveryScanner || new SyncRecoveryScanner(this.db, this.outbox);
  }

  /**
   * Starts background sync coordination (foreground periodic timer and online listeners).
   */
  public start(intervalMs = 60000): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncNow('network_online'));
    }

    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.syncNow('periodic_interval');
      }, intervalMs);
    }
  }

  /**
   * Stops background synchronization timers and listeners.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Triggers an immediate push/pull synchronization cycle.
   */
  public async syncNow(triggerReason = 'manual'): Promise<PushResult> {
    if (this.isSyncing) {
      return { processedCount: 0, succeededCount: 0, failedCount: 0, deadCount: 0 };
    }

    this.isSyncing = true;
    SyncEventEmitter.emit('workout_sync_started', { triggerReason });

    try {
      // 1. Run recovery scan to find unqueued dirty records
      const recoveredCount = await this.recoveryScanner.scanAndRecover();
      if (recoveredCount > 0) {
        SyncEventEmitter.emit('sync_recovery_detected', { recoveredCount });
      }

      // 2. Push pending outbox operations
      const pushResult = await this.pushWorker.pushPendingOperations();

      // 3. Pull incremental remote updates across all domain stores
      await this.pullWorker.pullStoreChanges('workout_templates', STORES.WORKOUT_TEMPLATES);
      await this.pullWorker.pullStoreChanges('generated_workouts', STORES.GENERATED_WORKOUTS);
      await this.pullWorker.pullStoreChanges('workout_sessions', STORES.WORKOUT_SESSIONS);
      await this.pullWorker.pullStoreChanges('favorites', STORES.FAVORITES);

      SyncEventEmitter.emit('workout_sync_succeeded', {
        pushed: pushResult.succeededCount,
        failed: pushResult.failedCount,
        dead: pushResult.deadCount,
      });

      return pushResult;
    } catch (error: any) {
      SyncEventEmitter.emit('sync_queue_item_failed', {
        error: error?.message || String(error),
      });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Retries dead-lettered items in the queue by resetting their status to pending.
   */
  public async retryFailed(): Promise<number> {
    const all = await this.db.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    const failedItems = all.filter((i) => i.status === 'dead' || i.status === 'failed');
    const now = new Date().toISOString();

    for (const item of failedItems) {
      item.status = 'pending';
      item.retryCount = 0;
      item.nextAttemptAt = now;
      await this.outbox.updateItem(item);
    }

    if (failedItems.length > 0) {
      await this.syncNow('retry_failed');
    }

    return failedItems.length;
  }

  /**
   * Retrieves high-level human-readable sync state for UI components.
   */
  public async getStatus(): Promise<SyncStatusState> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const queue = await this.db.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    const conflicts = await this.db.getAll<SyncConflictItem>(STORES.SYNC_CONFLICTS);

    const pendingCount = queue.filter((i) => i.status === 'pending' || i.status === 'processing').length;
    const failedCount = queue.filter((i) => i.status === 'failed').length;
    const deadCount = queue.filter((i) => i.status === 'dead').length;
    const conflictCount = conflicts.filter((c) => !c.resolved).length;

    let statusText: SyncStatusState['statusText'] = 'Synced';

    if (!isOnline) {
      statusText = 'Offline';
    } else if (this.isSyncing) {
      statusText = 'Syncing';
    } else if (deadCount > 0 || conflictCount > 0) {
      statusText = 'Needs attention';
    } else if (failedCount > 0) {
      statusText = 'Sync failed';
    } else if (pendingCount > 0) {
      statusText = 'Sync pending';
    } else {
      statusText = 'Synced';
    }

    const lastSucceeded = queue
      .filter((i) => i.status === 'succeeded' && i.processedAt)
      .sort((a, b) => new Date(b.processedAt!).getTime() - new Date(a.processedAt!).getTime())[0];

    const lastErrorItem = queue
      .filter((i) => i.status === 'dead' || i.status === 'failed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

    return {
      isOnline,
      isSyncing: this.isSyncing,
      statusText,
      pendingCount,
      failedCount,
      deadCount,
      conflictCount,
      lastSyncedAt: lastSucceeded?.processedAt || null,
      lastError: lastErrorItem?.errorData?.message ? String(lastErrorItem.errorData.message) : null,
    };
  }
}

// Global Singleton Instance
let coordinatorInstance: SyncCoordinator | null = null;

export function getSyncCoordinator(): SyncCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new SyncCoordinator();
  }
  return coordinatorInstance;
}
