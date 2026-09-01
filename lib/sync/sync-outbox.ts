/**
 * Sync Outbox & Enqueueing Manager
 * Enqueues authenticated mutations into IndexedDB sync_queue.
 * Refuses cloud sync for guest records (ownerKind === 'guest').
 */

import { getIndexedDBEngine, IndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES, OwnerKind } from '../storage/indexeddb-schema';
import { SyncOperationType, SyncQueueItem } from './sync-types';
import { SyncIdempotency } from './sync-idempotency';

export interface EnqueueMutationOptions {
  ownerKind: OwnerKind;
  ownerId: string;
  entityType: string;
  entityId: string;
  operation: SyncOperationType;
  version: number;
  payload: Record<string, unknown>;
  baseUpdatedAt?: string;
}

export class SyncOutbox {
  private db: IndexedDBEngine;

  constructor(db?: IndexedDBEngine) {
    this.db = db || getIndexedDBEngine();
  }

  /**
   * Enqueues a mutation into the sync outbox.
   * If ownerKind is 'guest', returns null because guest data never synchronizes to Supabase cloud.
   */
  public async enqueue(options: EnqueueMutationOptions): Promise<SyncQueueItem | null> {
    if (options.ownerKind === 'guest') {
      // Guest records remain local only
      return null;
    }

    const now = new Date().toISOString();
    const idempotencyKey = SyncIdempotency.generateKey(
      options.ownerId,
      options.entityType,
      options.entityId,
      options.operation,
      options.version
    );

    // Check if an identical uncompleted queue item already exists
    const existingQueue = await this.db.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    const duplicate = existingQueue.find(
      (item) => item.idempotencyKey === idempotencyKey && (item.status === 'pending' || item.status === 'processing')
    );

    if (duplicate) {
      return duplicate;
    }

    const queueItem: SyncQueueItem = {
      id: `sq-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      operation: options.operation,
      entityType: options.entityType,
      entityId: options.entityId,
      idempotencyKey,
      payload: options.payload,
      baseVersion: options.version,
      baseUpdatedAt: options.baseUpdatedAt || now,
      retryCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
      lastAttemptAt: null,
      processedAt: null,
      errorData: null,
    };

    await this.db.put(STORES.SYNC_QUEUE, queueItem);
    return queueItem;
  }

  /**
   * Retrieves all pending queue items due for execution.
   */
  public async getDueItems(maxBatchSize = 25): Promise<SyncQueueItem[]> {
    const all = await this.db.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    const now = Date.now();

    return all
      .filter((item) => item.status === 'pending' && new Date(item.nextAttemptAt).getTime() <= now)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, maxBatchSize);
  }

  /**
   * Updates an item's status in the queue.
   */
  public async updateItem(item: SyncQueueItem): Promise<void> {
    item.updatedAt = new Date().toISOString();
    await this.db.put(STORES.SYNC_QUEUE, item);
  }

  /**
   * Removes succeeded queue items or drains completed entries.
   */
  public async removeItem(id: string): Promise<void> {
    await this.db.delete(STORES.SYNC_QUEUE, id);
  }
}
