/**
 * Local Challenge Repository (IndexedDB Backed)
 * Implements ChallengeRepository for Challenge and ChallengeProgress entities.
 * Separates platform challenge catalog from user-owned participation state.
 */

import { ChallengeRepository } from '@/lib/repositories/interfaces';
import { Challenge, ChallengeProgress } from '@/types/domain';
import { PLATFORM_CHALLENGE_CATALOG } from '@/lib/domain/platform-catalogs';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import {
  STORES,
  LocalChallengeRecord,
  LocalChallengeProgressRecord,
  SyncQueueRecord,
} from '@/lib/storage/indexeddb-schema';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';

export class LocalChallengeRepository implements ChallengeRepository {
  constructor(
    private engine: IndexedDBEngine = IndexedDBEngine.getInstance(),
    private invalidationBus: ProgressInvalidationBus = ProgressInvalidationBus.getInstance()
  ) {}

  public async listChallenges(): Promise<Challenge[]> {
    try {
      // 1. Fetch custom user-created challenges from IndexedDB
      const customRecords = await this.engine.getAll<LocalChallengeRecord>(STORES.CHALLENGES);
      const validCustom = customRecords.filter((r) => !r.deletedAt).map((r) => r.challenge);

      // 2. Merge with platform challenge catalog
      const catalog = PLATFORM_CHALLENGE_CATALOG;
      return [...catalog, ...validCustom];
    } catch (err) {
      console.error('[LocalChallengeRepository] Failed to list challenges:', err);
      return PLATFORM_CHALLENGE_CATALOG;
    }
  }

  public async getChallengeById(id: string): Promise<Challenge | null> {
    const all = await this.listChallenges();
    return all.find((c) => c.id === id) || null;
  }

  public async getUserChallengeProgress(
    challengeId: string,
    userId?: string
  ): Promise<ChallengeProgress | null> {
    try {
      const records = await this.engine.getByIndex<LocalChallengeProgressRecord>(
        STORES.CHALLENGE_PROGRESS,
        'challengeId',
        challengeId
      );

      const ownerId = userId || 'guest_user';
      const userRecord = records.find((r) => r.ownerId === ownerId && !r.deletedAt);
      return userRecord?.progress || null;
    } catch (err) {
      console.error('[LocalChallengeRepository] Failed to get user challenge progress:', err);
      return null;
    }
  }

  public async listUserParticipations(userId?: string): Promise<ChallengeProgress[]> {
    try {
      let records: LocalChallengeProgressRecord[];
      if (userId) {
        records = await this.engine.getByIndex<LocalChallengeProgressRecord>(
          STORES.CHALLENGE_PROGRESS,
          'ownerId',
          userId
        );
      } else {
        records = await this.engine.getAll<LocalChallengeProgressRecord>(STORES.CHALLENGE_PROGRESS);
      }

      return records.filter((r) => !r.deletedAt).map((r) => r.progress);
    } catch (err) {
      console.error('[LocalChallengeRepository] Failed to list user participations:', err);
      return [];
    }
  }

  public async saveChallengeProgress(progress: ChallengeProgress): Promise<void> {
    const now = new Date().toISOString();
    const ownerId = progress.userId || 'guest_user';
    const ownerKind = progress.userId ? 'user' : 'guest';

    const existing = await this.engine.get<LocalChallengeProgressRecord>(
      STORES.CHALLENGE_PROGRESS,
      progress.id
    );

    const record: LocalChallengeProgressRecord = {
      id: progress.id,
      ownerKind,
      ownerId,
      challengeId: progress.challengeId,
      progress: {
        ...progress,
        updatedAt: now,
      },
      version: (existing?.version || 0) + 1,
      syncStatus: 'queued',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      clientUpdatedAt: now,
      deletedAt: null,
    };

    await this.engine.put(STORES.CHALLENGE_PROGRESS, record);

    const syncItem: SyncQueueRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operation: 'upsert',
      entityType: 'challenge_progress',
      entityId: progress.id,
      idempotencyKey: `chal_prog_${progress.id}_${now}`,
      payload: progress as unknown as Record<string, unknown>,
      baseVersion: record.version,
      baseUpdatedAt: now,
      retryCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    };
    await this.engine.put(STORES.SYNC_QUEUE, syncItem);

    this.invalidationBus.emit({
      type: 'challenge_changed',
      entityId: progress.challengeId,
      timestamp: Date.now(),
    });
  }
}
