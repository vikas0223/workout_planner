/**
 * Local Recommendation Repository
 *
 * Requirements:
 * - Persists and queries RecommendationEvent records exclusively.
 * - Zero storage of derived recommendation objects (recommendations remain purely derived on demand).
 * - Implements guest isolation: guest events remain purely local.
 * - Authenticated events enqueue into SYNC_QUEUE.
 */

import { RecommendationEvent } from '@/types/domain';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import {
  STORES,
  RecommendationEventRecord,
  SyncQueueRecord,
  OwnerKind,
} from '@/lib/storage/indexeddb-schema';

export class LocalRecommendationRepository {
  constructor(private engine: IndexedDBEngine = IndexedDBEngine.getInstance()) {}

  /**
   * Persists a recommendation interaction event (shown, accepted, dismissed, rated).
   */
  public async saveEvent(
    event: RecommendationEvent,
    ownerKind: OwnerKind = 'guest',
    ownerId: string = 'guest_user'
  ): Promise<void> {
    const now = event.createdAt || new Date().toISOString();
    const eventId = event.id || `recevt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const record: RecommendationEventRecord = {
      id: eventId,
      ownerKind,
      ownerId: event.userId || ownerId,
      createdAt: now,
      updatedAt: now,
      clientUpdatedAt: now,
      version: 1,
      syncStatus: ownerKind === 'user' ? 'queued' : 'local',
      deletedAt: null,
      event: {
        ...event,
        id: eventId,
        createdAt: now,
      },
    };

    await this.engine.put<RecommendationEventRecord>(STORES.RECOMMENDATION_EVENTS, record);

    // If authenticated user, enqueue into SYNC_QUEUE for cloud synchronization
    if (ownerKind === 'user') {
      const syncItem: SyncQueueRecord = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        operation: 'insert',
        entityType: 'recommendation_events',
        entityId: eventId,
        idempotencyKey: `recevt_${eventId}_${now}`,
        payload: record.event as unknown as Record<string, unknown>,
        baseVersion: 1,
        baseUpdatedAt: now,
        retryCount: 0,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        nextAttemptAt: now,
        lastAttemptAt: null,
        processedAt: null,
        errorData: null,
      };

      await this.engine.put(STORES.SYNC_QUEUE, syncItem);
    }
  }

  /**
   * Lists recent recommendation events for cooldown and interaction history.
   */
  public async listEvents(userId?: string, limit: number = 50): Promise<RecommendationEvent[]> {
    try {
      let records: RecommendationEventRecord[];
      if (userId) {
        records = await this.engine.getByIndex<RecommendationEventRecord>(
          STORES.RECOMMENDATION_EVENTS,
          'ownerId',
          userId
        );
      } else {
        records = await this.engine.getAll<RecommendationEventRecord>(STORES.RECOMMENDATION_EVENTS);
      }

      return records
        .filter((r) => !r.deletedAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map((r) => r.event);
    } catch (err) {
      console.warn('[LocalRecommendationRepository] Failed to listEvents', err);
      return [];
    }
  }

  /**
   * Retrieves a set of dismissed recommendation fingerprints within the active cooldown window.
   */
  public async getDismissedFingerprints(
    userId?: string,
    sinceTimestampMs?: number
  ): Promise<Set<string>> {
    const cutoff = sinceTimestampMs ?? Date.now() - 24 * 60 * 60 * 1000; // default 24h
    const dismissed = new Set<string>();

    try {
      let records: RecommendationEventRecord[];
      if (userId) {
        records = await this.engine.getByIndex<RecommendationEventRecord>(
          STORES.RECOMMENDATION_EVENTS,
          'ownerId',
          userId
        );
      } else {
        records = await this.engine.getAll<RecommendationEventRecord>(STORES.RECOMMENDATION_EVENTS);
      }

      for (const r of records) {
        if (!r.deletedAt && r.event?.action === 'dismissed') {
          const time = new Date(r.event.createdAt).getTime();
          if (time >= cutoff) {
            dismissed.add(r.event.entityId);
          }
        }
      }
    } catch (err) {
      console.warn('[LocalRecommendationRepository] Failed to getDismissedFingerprints', err);
    }

    return dismissed;
  }
}
