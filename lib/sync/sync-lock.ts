/**
 * Multi-Tab Sync Lock Manager
 * Prevents concurrent sync queue processing across multiple browser tabs.
 * Uses outbox_locks in IndexedDB with TTL and heartbeat renewal.
 */

import { getIndexedDBEngine, IndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES } from '../storage/indexeddb-schema';
import { SyncLockRecord } from './sync-types';

export class SyncLock {
  private db: IndexedDBEngine;
  public readonly tabId: string;
  private readonly defaultTtlMs: number;
  private readonly lockKey = 'sync_worker_master_lock';

  constructor(db?: IndexedDBEngine, tabId?: string, defaultTtlMs = 30000) {
    this.db = db || getIndexedDBEngine();
    this.tabId = tabId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tab-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Attempts to acquire the exclusive master sync lock.
   * Returns true if acquired or already owned by this tab.
   */
  public async acquire(ttlMs = this.defaultTtlMs): Promise<boolean> {
    const now = new Date();
    const existing = await this.db.get<SyncLockRecord>(STORES.OUTBOX_LOCKS, this.lockKey);

    if (existing) {
      const expiresAt = new Date(existing.expiresAt);
      const isExpired = expiresAt.getTime() <= now.getTime();
      const isSameOwner = existing.ownerTabId === this.tabId;

      if (!isExpired && !isSameOwner) {
        return false; // Actively held by another tab
      }
    }

    const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
    const lockRecord: SyncLockRecord = {
      lockKey: this.lockKey,
      ownerTabId: this.tabId,
      acquiredAt: now.toISOString(),
      expiresAt,
    };

    await this.db.put(STORES.OUTBOX_LOCKS, lockRecord);
    return true;
  }

  /**
   * Renews the lock lease if owned by this tab.
   */
  public async renew(ttlMs = this.defaultTtlMs): Promise<boolean> {
    const existing = await this.db.get<SyncLockRecord>(STORES.OUTBOX_LOCKS, this.lockKey);
    if (!existing || existing.ownerTabId !== this.tabId) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
    const updatedRecord: SyncLockRecord = {
      ...existing,
      expiresAt,
    };

    await this.db.put(STORES.OUTBOX_LOCKS, updatedRecord);
    return true;
  }

  /**
   * Releases the lock only if owned by this tab.
   */
  public async release(): Promise<boolean> {
    const existing = await this.db.get<SyncLockRecord>(STORES.OUTBOX_LOCKS, this.lockKey);
    if (!existing) {
      return true;
    }

    if (existing.ownerTabId !== this.tabId) {
      return false; // Cannot release another tab's lock
    }

    await this.db.delete(STORES.OUTBOX_LOCKS, this.lockKey);
    return true;
  }

  /**
   * Checks if this tab currently owns an unexpired lock.
   */
  public async isHeldByMe(): Promise<boolean> {
    const existing = await this.db.get<SyncLockRecord>(STORES.OUTBOX_LOCKS, this.lockKey);
    if (!existing) return false;
    if (existing.ownerTabId !== this.tabId) return false;
    return new Date(existing.expiresAt).getTime() > Date.now();
  }
}
